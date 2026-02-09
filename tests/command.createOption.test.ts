import { Command, Option } from "../index.ts";

class MyOption extends Option {
  myProperty = "MyOption";

  constructor(flags: string, description?: string) {
    super(flags, description);
  }
}

class MyCommand extends Command {
  createOption(flags: string, description?: string) {
    return new MyOption(flags, description);
  }
}

test("when override createOption then used for option()", () => {
  const program = new MyCommand();
  program.option("-a, --alpha");
  expect(program.options.length).toEqual(1);
  expect((program.options[0] as MyOption).myProperty).toEqual("MyOption");
});

test("when override createOption then used for requiredOption()", () => {
  const program = new MyCommand();
  program.requiredOption("-a, --alpha");
  expect(program.options.length).toEqual(1);
  expect((program.options[0] as MyOption).myProperty).toEqual("MyOption");
});

test("when override createOption then used for version()", () => {
  const program = new MyCommand();
  program.version("1.2.3");
  expect(program.options.length).toEqual(1);
  expect((program.options[0] as MyOption).myProperty).toEqual("MyOption");
});

test("when override createOption then used for help option in visibleOptions", () => {
  const program = new MyCommand();
  const visibleOptions = program.createHelp().visibleOptions(program);
  expect(visibleOptions.length).toEqual(1);
  expect((visibleOptions[0] as MyOption).myProperty).toEqual("MyOption");
});
