import { humanReadableArgName } from "./argument.ts";
import type { Argument } from "./argument.ts";
import type { Command } from "./command.ts";
import type { Option } from "./option.ts";

// Although this is a class, methods are static in style to allow override using subclass or just functions.
class Help {
  public helpWidth: number | undefined;
  public minWidthToWrap: number;
  public sortSubcommands: boolean;
  public sortOptions: boolean;
  public showGlobalOptions: boolean;

  constructor() {
    this.helpWidth = undefined;
    this.minWidthToWrap = 40;
    this.sortSubcommands = false;
    this.sortOptions = false;
    this.showGlobalOptions = false;
  }

  /**
   * prepareContext is called by Commander after applying overrides from `Command.configureHelp()`
   * and just before calling `formatHelp()`.
   *
   * Commander just uses the helpWidth and the rest is provided for optional use by more complex subclasses.
   *
   * @param {{ error?: boolean, helpWidth?: number, outputHasColors?: boolean }} contextOptions
   */
  prepareContext(contextOptions: {
    error?: boolean;
    helpWidth?: number;
    outputHasColors?: boolean;
  }) {
    this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
  }

  /**
   * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
   *
   * @param {Command} cmd
   * @returns {Command[]}
   */
  visibleCommands(cmd: Command): Command[] {
    const visibleCommands = cmd.commands.filter((cmd) => !cmd._hidden);
    const helpCommand = cmd._getHelpCommand();
    if (helpCommand && !helpCommand._hidden) {
      visibleCommands.push(helpCommand);
    }
    if (this.sortSubcommands) {
      visibleCommands.sort((a, b) => {
        return a.name().localeCompare(b.name());
      });
    }
    return visibleCommands;
  }

  /**
   * Compare options for sort.
   *
   * @param {Option} a
   * @param {Option} b
   * @returns {number}
   */
  compareOptions(a: Option, b: Option): number {
    const getSortKey = (option: Option) => {
      // WYSIWYG for order displayed in help. Short used for comparison if present. No special handling for negated.
      return option.short
        ? option.short.replace(/^-/, "")
        : option.long!.replace(/^--/, "");
    };
    return getSortKey(a).localeCompare(getSortKey(b));
  }

  /**
   * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
   *
   * @param {Command} cmd
   * @returns {Option[]}
   */
  visibleOptions(cmd: Command): Option[] {
    const visibleOptions = cmd.options.filter((option) => !option.hidden);
    // Built-in help option.
    const helpOption = cmd._getHelpOption();
    if (helpOption && !helpOption.hidden) {
      // Automatically hide conflicting flags. Bit dubious but a historical behaviour that is convenient for single-command programs.
      const removeShort = helpOption.short && cmd._findOption(helpOption.short);
      const removeLong = helpOption.long && cmd._findOption(helpOption.long);
      if (!removeShort && !removeLong) {
        visibleOptions.push(helpOption); // no changes needed
      } else if (helpOption.long && !removeLong) {
        visibleOptions.push(
          cmd.createOption(helpOption.long, helpOption.description),
        );
      } else if (helpOption.short && !removeShort) {
        visibleOptions.push(
          cmd.createOption(helpOption.short, helpOption.description),
        );
      }
    }
    if (this.sortOptions) {
      visibleOptions.sort(this.compareOptions);
    }
    return visibleOptions;
  }

  /**
   * Get an array of the visible global options. (Not including help.)
   *
   * @param {Command} cmd
   * @returns {Option[]}
   */
  visibleGlobalOptions(cmd: Command): Option[] {
    if (!this.showGlobalOptions) return [];

    const globalOptions = [];
    for (
      let ancestorCmd = cmd.parent;
      ancestorCmd;
      ancestorCmd = ancestorCmd.parent
    ) {
      const visibleOptions = ancestorCmd.options.filter(
        (option) => !option.hidden,
      );
      globalOptions.push(...visibleOptions);
    }
    if (this.sortOptions) {
      globalOptions.sort(this.compareOptions);
    }
    return globalOptions;
  }

  /**
   * Get an array of the arguments if any have a description.
   *
   * @param {Command} cmd
   * @returns {Argument[]}
   */
  visibleArguments(cmd: Command): Argument[] {
    // Side effect! Apply the legacy descriptions before the arguments are displayed.
    if (cmd._argsDescription) {
      const argsDescription = cmd._argsDescription;
      cmd.registeredArguments.forEach((argument) => {
        argument.description =
          argument.description || argsDescription[argument.name()] || "";
      });
    }

    // If there are any arguments with a description then return all the arguments.
    if (cmd.registeredArguments.find((argument) => argument.description)) {
      return cmd.registeredArguments;
    }
    return [];
  }

  /**
   * Get the command term to show in the list of subcommands.
   *
   * @param {Command} cmd
   * @returns {string}
   */
  subcommandTerm(cmd: Command): string {
    // Legacy. Ignores custom usage string, and nested commands.
    const args = cmd.registeredArguments
      .map((arg) => humanReadableArgName(arg))
      .join(" ");
    return (
      cmd._name +
      (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") +
      (cmd.options.length ? " [options]" : "") + // simplistic check for non-help option
      (args ? " " + args : "")
    );
  }

  /**
   * Get the option term to show in the list of options.
   *
   * @param {Option} option
   * @returns {string}
   */
  optionTerm(option: Option): string {
    return option.flags;
  }

  /**
   * Get the argument term to show in the list of arguments.
   *
   * @param {Argument} argument
   * @returns {string}
   */
  argumentTerm(argument: Argument): string {
    return argument.name();
  }

  /**
   * Get the longest command term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  longestSubcommandTermLength(cmd: Command, helper: Help): number {
    return helper.visibleCommands(cmd).reduce((max, command) => {
      return Math.max(
        max,
        this.displayWidth(
          helper.styleSubcommandTerm(helper.subcommandTerm(command)),
        ),
      );
    }, 0);
  }

  /**
   * Get the longest option term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  longestOptionTermLength(cmd: Command, helper: Help): number {
    return helper.visibleOptions(cmd).reduce((max, option) => {
      return Math.max(
        max,
        this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))),
      );
    }, 0);
  }

  /**
   * Get the longest global option term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  longestGlobalOptionTermLength(cmd: Command, helper: Help): number {
    return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
      return Math.max(
        max,
        this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))),
      );
    }, 0);
  }

  /**
   * Get the longest argument term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  longestArgumentTermLength(cmd: Command, helper: Help): number {
    return helper.visibleArguments(cmd).reduce((max, argument) => {
      return Math.max(
        max,
        this.displayWidth(
          helper.styleArgumentTerm(helper.argumentTerm(argument)),
        ),
      );
    }, 0);
  }

  /**
   * Get the command usage to be displayed at the top of the built-in help.
   *
   * @param {Command} cmd
   * @returns {string}
   */
  commandUsage(cmd: Command): string {
    // Usage
    let cmdName = cmd._name;
    if (cmd._aliases[0]) {
      cmdName = cmdName + "|" + cmd._aliases[0];
    }
    let ancestorCmdNames = "";
    for (
      let ancestorCmd = cmd.parent;
      ancestorCmd;
      ancestorCmd = ancestorCmd.parent
    ) {
      ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
    }
    return ancestorCmdNames + cmdName + " " + cmd.usage();
  }

  /**
   * Get the description for the command.
   *
   * @param {Command} cmd
   * @returns {string}
   */
  commandDescription(cmd: Command): string {
    return cmd.description();
  }

  /**
   * Get the subcommand summary to show in the list of subcommands.
   * (Fallback to description for backwards compatibility.)
   *
   * @param {Command} cmd
   * @returns {string}
   */
  subcommandDescription(cmd: Command): string {
    return cmd.summary() || cmd.description();
  }

  /**
   * Get the option description to show in the list of options.
   *
   * @param {Option} option
   * @return {string}
   */
  optionDescription(option: Option): string {
    const extraInfo: string[] = [];

    if (option.argChoices) {
      extraInfo.push(
        // use stringify to match the display of the default value
        `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`,
      );
    }
    if (option.defaultValue !== undefined) {
      // default for boolean and negated more for programmer than end user,
      // but show true/false for boolean option as may be for hand-rolled env or config processing.
      const showDefault =
        option.required ||
        option.optional ||
        (option.isBoolean() && typeof option.defaultValue === "boolean");
      if (showDefault) {
        extraInfo.push(
          `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`,
        );
      }
    }
    // preset for boolean and negated are more for programmer than end user
    if (option.presetArg !== undefined && option.optional) {
      extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
    }
    if (option.envVar !== undefined) {
      extraInfo.push(`env: ${option.envVar}`);
    }
    if (extraInfo.length > 0) {
      const extraDescription = `(${extraInfo.join(", ")})`;
      if (option.description) {
        return `${option.description} ${extraDescription}`;
      }
      return extraDescription;
    }

    return option.description;
  }

  /**
   * Get the argument description to show in the list of arguments.
   *
   * @param {Argument} argument
   * @return {string}
   */
  argumentDescription(argument: Argument): string {
    const extraInfo: string[] = [];
    if (argument.argChoices) {
      extraInfo.push(
        // use stringify to match the display of the default value
        `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`,
      );
    }
    if (argument.defaultValue !== undefined) {
      extraInfo.push(
        `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`,
      );
    }
    if (extraInfo.length > 0) {
      const extraDescription = `(${extraInfo.join(", ")})`;
      if (argument.description) {
        return `${argument.description} ${extraDescription}`;
      }
      return extraDescription;
    }
    return argument.description;
  }

  /**
   * Format a list of items, given a heading and an array of formatted items.
   *
   * @param {string} heading
   * @param {string[]} items
   * @param {Help} helper
   * @returns string[]
   */
  formatItemList(heading: string, items: string[], helper: Help): string[] {
    if (items.length === 0) return [];

    return [helper.styleTitle(heading), ...items, ""];
  }

  /**
   * Group items by their help group heading.
   *
   * @param {Command[] | Option[]} unsortedItems
   * @param {Command[] | Option[]} visibleItems
   * @param {Function} getGroup
   * @returns {Map<string, Command[] | Option[]>}
   */
  groupItems<T>(
    unsortedItems: T[],
    visibleItems: T[],
    getGroup: (item: T) => string,
  ): Map<string, T[]> {
    const result = new Map<string, T[]>();
    // Add groups in order of appearance in unsortedItems.
    unsortedItems.forEach((item) => {
      const group = getGroup(item);
      if (!result.has(group)) result.set(group, []);
    });
    // Add items in order of appearance in visibleItems.
    visibleItems.forEach((item) => {
      const group = getGroup(item);
      if (!result.has(group)) {
        result.set(group, []);
      }
      result.get(group)?.push(item);
    });
    return result;
  }

  /**
   * Generate the built-in help text.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {string}
   */
  formatHelp(cmd: Command, helper: Help): string {
    const termWidth = helper.padWidth(cmd, helper);
    const helpWidth = helper.helpWidth ?? 80; // in case prepareContext() was not called

    function callFormatItem(term: string, description: string) {
      return helper.formatItem(term, termWidth, description, helper);
    }

    // Usage
    let output = [
      `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
      "",
    ];

    // Description
    const commandDescription = helper.commandDescription(cmd);
    if (commandDescription.length > 0) {
      output = output.concat([
        helper.boxWrap(
          helper.styleCommandDescription(commandDescription),
          helpWidth,
        ),
        "",
      ]);
    }

    // Arguments
    const argumentList = helper.visibleArguments(cmd).map((argument) => {
      return callFormatItem(
        helper.styleArgumentTerm(helper.argumentTerm(argument)),
        helper.styleArgumentDescription(helper.argumentDescription(argument)),
      );
    });
    output = output.concat(
      this.formatItemList("Arguments:", argumentList, helper),
    );

    // Options
    const optionGroups = this.groupItems(
      cmd.options,
      helper.visibleOptions(cmd),
      (option) => option.helpGroupHeading ?? "Options:",
    );
    optionGroups.forEach((options, group) => {
      const optionList = options.map((option) => {
        return callFormatItem(
          helper.styleOptionTerm(helper.optionTerm(option)),
          helper.styleOptionDescription(helper.optionDescription(option)),
        );
      });
      output = output.concat(this.formatItemList(group, optionList, helper));
    });

    if (helper.showGlobalOptions) {
      const globalOptionList = helper
        .visibleGlobalOptions(cmd)
        .map((option) => {
          return callFormatItem(
            helper.styleOptionTerm(helper.optionTerm(option)),
            helper.styleOptionDescription(helper.optionDescription(option)),
          );
        });
      output = output.concat(
        this.formatItemList("Global Options:", globalOptionList, helper),
      );
    }

    // Commands
    const commandGroups = this.groupItems(
      cmd.commands,
      helper.visibleCommands(cmd),
      (sub) => sub.helpGroup() || "Commands:",
    );
    commandGroups.forEach((commands, group) => {
      const commandList = commands.map((sub) => {
        return callFormatItem(
          helper.styleSubcommandTerm(helper.subcommandTerm(sub)),
          helper.styleSubcommandDescription(helper.subcommandDescription(sub)),
        );
      });
      output = output.concat(this.formatItemList(group, commandList, helper));
    });

    return output.join("\n");
  }

  /**
   * Return display width of string, ignoring ANSI escape sequences. Used in padding and wrapping calculations.
   *
   * @param {string} str
   * @returns {number}
   */
  displayWidth(str: string): number {
    return stripColor(str).length;
  }

  /**
   * Style the title for displaying in the help. Called with 'Usage:', 'Options:', etc.
   *
   * @param {string} str
   * @returns {string}
   */
  styleTitle(str: string): string {
    return str;
  }

  styleUsage(str: string): string {
    // Usage has lots of parts the user might like to color separately! Assume default usage string which is formed like:
    //    command subcommand [options] [command] <foo> [bar]
    return str
      .split(" ")
      .map((word) => {
        if (word === "[options]") return this.styleOptionText(word);
        if (word === "[command]") return this.styleSubcommandText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleCommandText(word); // Restrict to initial words?
      })
      .join(" ");
  }
  styleCommandDescription(str: string): string {
    return this.styleDescriptionText(str);
  }
  styleOptionDescription(str: string): string {
    return this.styleDescriptionText(str);
  }
  styleSubcommandDescription(str: string): string {
    return this.styleDescriptionText(str);
  }
  styleArgumentDescription(str: string): string {
    return this.styleDescriptionText(str);
  }
  styleDescriptionText(str: string): string {
    return str;
  }
  styleOptionTerm(str: string): string {
    return this.styleOptionText(str);
  }
  styleSubcommandTerm(str: string): string {
    // This is very like usage with lots of parts! Assume default string which is formed like:
    //    subcommand [options] <foo> [bar]
    return str
      .split(" ")
      .map((word) => {
        if (word === "[options]") return this.styleOptionText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleSubcommandText(word); // Restrict to initial words?
      })
      .join(" ");
  }
  styleArgumentTerm(str: string): string {
    return this.styleArgumentText(str);
  }
  styleOptionText(str: string): string {
    return str;
  }
  styleArgumentText(str: string): string {
    return str;
  }
  styleSubcommandText(str: string): string {
    return str;
  }
  styleCommandText(str: string): string {
    return str;
  }

  /**
   * Calculate the pad width from the maximum term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  padWidth(cmd: Command, helper: Help): number {
    return Math.max(
      helper.longestOptionTermLength(cmd, helper),
      helper.longestGlobalOptionTermLength(cmd, helper),
      helper.longestSubcommandTermLength(cmd, helper),
      helper.longestArgumentTermLength(cmd, helper),
    );
  }

  /**
   * Detect manually wrapped and indented strings by checking for line break followed by whitespace.
   *
   * @param {string} str
   * @returns {boolean}
   */
  preformatted(str: string): boolean {
    return /\n[^\S\r\n]/.test(str);
  }

  /**
   * Format the "item", which consists of a term and description. Pad the term and wrap the description, indenting the following lines.
   *
   * So "TTT", 5, "DDD DDDD DD DDD" might be formatted for this.helpWidth=17 like so:
   *   TTT  DDD DDDD
   *        DD DDD
   *
   * @param {string} term
   * @param {number} termWidth
   * @param {string} description
   * @param {Help} helper
   * @returns {string}
   */
  formatItem(
    term: string,
    termWidth: number,
    description: string,
    helper: Help,
  ): string {
    const itemIndent = 2;
    const itemIndentStr = " ".repeat(itemIndent);
    if (!description) return itemIndentStr + term;

    // Pad the term out to a consistent width, so descriptions are aligned.
    const paddedTerm = term.padEnd(
      termWidth + term.length - helper.displayWidth(term),
    );

    // Format the description.
    const spacerWidth = 2; // between term and description
    const helpWidth = this.helpWidth ?? 80; // in case prepareContext() was not called
    const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
    let formattedDescription;
    if (
      remainingWidth < this.minWidthToWrap ||
      helper.preformatted(description)
    ) {
      formattedDescription = description;
    } else {
      const wrappedDescription = helper.boxWrap(description, remainingWidth);
      formattedDescription = wrappedDescription.replace(
        /\n/g,
        "\n" + " ".repeat(termWidth + spacerWidth),
      );
    }

    // Construct and overall indent.
    return (
      itemIndentStr +
      paddedTerm +
      " ".repeat(spacerWidth) +
      formattedDescription.replace(/\n/g, `\n${itemIndentStr}`)
    );
  }

  /**
   * Wrap a string at whitespace, preserving existing line breaks.
   * Wrapping is skipped if the width is less than `minWidthToWrap`.
   *
   * @param {string} str
   * @param {number} width
   * @returns {string}
   */
  boxWrap(str: string, width: number): string {
    if (width < this.minWidthToWrap) return str;

    const rawLines = str.split(/\r\n|\n/);
    // split up text by whitespace
    const chunkPattern = /[\s]*[^\s]+/g;
    const wrappedLines: string[] = [];
    rawLines.forEach((line) => {
      const chunks = line.match(chunkPattern);
      if (chunks === null) {
        wrappedLines.push("");
        return;
      }

      const firstChunk = chunks.shift() as string;
      let sumChunks = [firstChunk];
      let sumWidth = this.displayWidth(sumChunks[0]);
      chunks.forEach((chunk) => {
        const visibleWidth = this.displayWidth(chunk);
        // Accumulate chunks while they fit into width.
        if (sumWidth + visibleWidth <= width) {
          sumChunks.push(chunk);
          sumWidth += visibleWidth;
          return;
        }
        wrappedLines.push(sumChunks.join(""));

        const nextChunk = chunk.trimStart(); // trim space at line break
        sumChunks = [nextChunk];
        sumWidth = this.displayWidth(nextChunk);
      });
      wrappedLines.push(sumChunks.join(""));
    });

    return wrappedLines.join("\n");
  }
}

/**
 * Strip style ANSI escape sequences from the string. In particular, SGR (Select Graphic Rendition) codes.
 *
 * @param {string} str
 * @returns {string}
 * @package
 */
function stripColor(str: string): string {
  // eslint-disable-next-line no-control-regex
  const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
  return str.replace(sgrPattern, "");
}

export { Help, stripColor };
