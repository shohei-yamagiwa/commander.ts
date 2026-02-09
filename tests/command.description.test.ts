import * as commander from "../index.ts";

test("when set description then get description", () => {
  const program = new commander.Command();
  const description = "abcdef";
  program.description(description);
  expect(program.description()).toMatch(description);
});
