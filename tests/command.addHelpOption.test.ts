import { Command, Option } from "../index.ts";

// More complete tests are in command.helpOption.test.js.

describe("addHelpOption", () => {
  let writeSpy;
  let writeErrorSpy;

  beforeAll(() => {
    // Optional. Suppress expected output to keep test output clean.
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => {});
    writeErrorSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    writeSpy.mockClear();
    writeErrorSpy.mockClear();
  });

  afterAll(() => {
    writeSpy.mockRestore();
    writeErrorSpy.mockRestore();
  });

  test("when addHelpOption has custom flags then custom short flag invokes help", () => {
    const program = new Command();
    program.exitOverride().addHelpOption(new Option("-c,--custom-help"));

    expect(() => {
      program.parse(["-c"], { from: "user" });
    }).toThrow("(outputHelp)");
  });

  test("when addHelpOption has custom flags then custom long flag invokes help", () => {
    const program = new Command();
    program.exitOverride().addHelpOption(new Option("-c,--custom-help"));

    expect(() => {
      program.parse(["--custom-help"], { from: "user" });
    }).toThrow("(outputHelp)");
  });

  test("when addHelpOption with hidden help option then help does not include help option", () => {
    const program = new Command();
    program.addHelpOption(
      new Option("-c,--custom-help", "help help help").hideHelp(),
    );
    const helpInfo = program.helpInformation();
    expect(helpInfo).not.toMatch(/help/);
  });
});
