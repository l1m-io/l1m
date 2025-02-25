class Dynamic {
  @@dynamic
}

function ExtractString(input: string) -> Dynamic {
  client "openai/gpt-4o" // This is a default, it will be replaced in code
  prompt #"
    Extract from this content:
    {{ input }}

    {{ ctx.output_format }}
  "#
}

function ExtractImage(input: image) -> Dynamic {
  client "openai/gpt-4o" // This is a default, it will be replaced in code
  prompt #"
    {{_.role("user")}}
    Extract from this content:
    {{ input }}

    {{ ctx.output_format }}
  "#
}

function ExtractAudio(input: audio) -> Dynamic {
  client "openai/gpt-4o" // This is a default, it will be replaced in code
  prompt #"
    {{_.role("user")}}
    Extract from this content:
    {{ input }}

    {{ ctx.output_format }}
  "#
}
