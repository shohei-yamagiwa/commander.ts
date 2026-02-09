import { Command, Help } from "../index.ts";

test("when override createCommand then affects help", () => {
  class MyHelp extends Help {
    formatHelp() {
      return "custom";
    }
  }

  class MyCommand extends Command {
    createHelp() {
      return Object.assign(new MyHelp(), this.configureHelp());
    }
  }

  const program = new MyCommand();
  expect(program.helpInformation()).toEqual("custom");
});
