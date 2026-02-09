import { Argument, Command } from "../index.ts";

class MyArgument extends Argument {
  myProperty = "MyArgument";

  constructor(name: string, description?: string) {
    super(name, description);
  }
}

class MyCommand extends Command {
  createArgument(name: string, description?: string) {
    return new MyArgument(name, description);
  }

  // createCommand for testing .command('sub <file>')
  createCommand(name: string) {
    return new MyCommand(name);
  }
}

test("when override createArgument then used for argument()", () => {
  const program = new MyCommand();
  program.argument("<file>");
  expect(program.registeredArguments.length).toEqual(1);
  expect((program.registeredArguments[0] as MyArgument).myProperty).toEqual(
    "MyArgument",
  );
});

test("when override createArgument then used for arguments()", () => {
  const program = new MyCommand();
  program.arguments("<file>");
  expect(program.registeredArguments.length).toEqual(1);
  expect((program.registeredArguments[0] as MyArgument).myProperty).toEqual(
    "MyArgument",
  );
});

test("when override createArgument and createCommand then used for argument of command()", () => {
  const program = new MyCommand();
  const sub = program.command("sub <file>");
  expect(sub.registeredArguments.length).toEqual(1);
  expect((sub.registeredArguments[0] as MyArgument).myProperty).toEqual(
    "MyArgument",
  );
});
