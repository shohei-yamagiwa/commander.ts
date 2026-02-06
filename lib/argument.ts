import { InvalidArgumentError } from "./error.ts";

type ArgParser = (value: string, previous: unknown) => unknown;

class Argument {
  public description: string;
  public required: boolean;
  public variadic: boolean;
  public parseArg: ArgParser | undefined;
  public defaultValue: unknown;
  public defaultValueDescription: string | undefined;
  public argChoices: string[] | undefined;
  private _name: string;

  /**
   * Initialize a new command argument with the given name and description.
   * The default is that the argument is required, and you can explicitly
   * indicate this with <> around the name. Put [] around the name for an optional argument.
   *
   * @param {string} name
   * @param {string} [description]
   */
  constructor(name: string, description?: string) {
    this.description = description || "";
    this.variadic = false;
    this.parseArg = undefined;
    this.defaultValue = undefined;
    this.defaultValueDescription = undefined;
    this.argChoices = undefined;

    switch (name[0]) {
      case "<": // e.g. <required>
        this.required = true;
        this._name = name.slice(1, -1);
        break;
      case "[": // e.g. [optional]
        this.required = false;
        this._name = name.slice(1, -1);
        break;
      default:
        this.required = true;
        this._name = name;
        break;
    }

    if (this._name.endsWith("...")) {
      this.variadic = true;
      this._name = this._name.slice(0, -3);
    }
  }

  /**
   * Return argument name.
   *
   * @return {string}
   */
  name(): string {
    return this._name;
  }

  /**
   * @package
   */
  _collectValue(value: string, previous: unknown): string[] {
    if (previous === this.defaultValue || !Array.isArray(previous)) {
      return [value];
    }

    previous.push(value);
    return previous;
  }

  /**
   * Set the default value, and optionally supply the description to be displayed in the help.
   *
   * @param {*} value
   * @param {string} [description]
   * @return {Argument}
   */
  default(value: unknown, description?: string): Argument {
    this.defaultValue = value;
    this.defaultValueDescription = description;
    return this;
  }

  /**
   * Set the custom handler for processing CLI command arguments into argument values.
   *
   * @param {Function} [fn]
   * @return {Argument}
   */
  argParser(fn?: ArgParser): Argument {
    this.parseArg = fn;
    return this;
  }

  /**
   * Only allow argument value to be one of choices.
   *
   * @param {string[]} values
   * @return {Argument}
   */
  choices(values: string[]): Argument {
    this.argChoices = values.slice();
    this.parseArg = (arg: string, previous: unknown) => {
      if (!this.argChoices?.includes(arg)) {
        throw new InvalidArgumentError(
          `Allowed choices are ${this.argChoices?.join(", ")}.`,
        );
      }
      if (this.variadic) {
        return this._collectValue(arg, previous);
      }
      return arg;
    };
    return this;
  }

  /**
   * Make argument required.
   *
   * @returns {Argument}
   */
  argRequired(): Argument {
    this.required = true;
    return this;
  }

  /**
   * Make argument optional.
   *
   * @returns {Argument}
   */
  argOptional(): Argument {
    this.required = false;
    return this;
  }
}

/**
 * Takes an argument and returns its human readable equivalent for help usage.
 *
 * @param {Argument} arg
 * @return {string}
 * @private
 */
function humanReadableArgName(arg: Argument): string {
  const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");

  return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
}

export { Argument, humanReadableArgName };
