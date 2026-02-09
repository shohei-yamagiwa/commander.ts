import * as commander from "../index.ts";

test("when call nested subcommand then runs", () => {
  const program = new commander.Command();
  const leafAction = vi.fn();
  program.command("sub1").command("sub2").action(leafAction);
  program.parse("node test.js sub1 sub2".split(" "));
  expect(leafAction).toHaveBeenCalled();
});
