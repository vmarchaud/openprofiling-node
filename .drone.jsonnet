
local pipeline(version) = {
    kind: "pipeline",
    name: "node-v" + version,
    steps: [
        {
            name: "tests",
            image: "node:" + version,
            commands: [
                "node -v",
                "yarn -v",
                "uname -r",
                "yarn install",
                "export PATH=$PATH:./node_modules/.bin/",
                "lerna bootstrap --npm-client yarn",
                "lerna run build --npm-client yarn",
                "lerna run ci --npm-client yarn",
                "lerna run lint --npm-client yarn",
            ],
            environment: {
              NODE_ENV: "test",
              CODECOV_TOKEN: {
                from_secret: "coverage_token"
              },
            }
        }
    ],
    trigger: {
      event: "push"
    }
};

[
    pipeline("6"),
    pipeline("8"),
    pipeline("10"),
    pipeline("11"),
    pipeline("12")
]