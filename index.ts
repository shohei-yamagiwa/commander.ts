import { Argument } from "./lib/argument.ts";
import { Command } from "./lib/command.ts";
import { CommanderError, InvalidArgumentError } from "./lib/error.ts";
import { Help } from "./lib/help.ts";
import { Option } from "./lib/option.ts";

const program = new Command();

const createCommand = (name?: string) => new Command(name);
const createOption = (flags: string, description?: string) =>
  new Option(flags, description);
const createArgument = (name: string, description?: string) =>
  new Argument(name, description);

/**
 * Expose classes
 */
const InvalidOptionArgumentError = InvalidArgumentError; // Deprecated

export {
  program,
  createCommand,
  createOption,
  createArgument,
  Command,
  Option,
  Argument,
  Help,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
};
