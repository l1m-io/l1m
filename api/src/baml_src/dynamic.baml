class Dynamic {
  @@dynamic
}

function ExtractString(input: string, instruction: string, additional: string) -> Dynamic {
  client "openai/gpt-4o" // This is a default, it will be replaced in code
  prompt #"
    {{ instruction }}
    {{ input }}

    {{ additional }}
    {{ ctx.output_format }}
  "#
}

function ExtractImage(input: image, instruction: string, additional: string) -> Dynamic {
  client "openai/gpt-4o" // This is a default, it will be replaced in code
  prompt #"
    {{_.role("user")}}
    {{ instruction }}
    {{ input }}

    {{ additional }}
    {{ ctx.output_format }}
  "#
}
