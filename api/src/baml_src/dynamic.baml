class Dynamic {
  @@dynamic
}

function ExtractString(input: string, additional: string) -> Dynamic {
  client "openai/gpt-4o" // This is a default, it will be replaced in code
  prompt #"
    Extract from this content:
    {{ input }}

    {{ additional }}
    {{ ctx.output_format }}
  "#
}

function ExtractImage(input: image, additional: string) -> Dynamic {
  client "openai/gpt-4o" // This is a default, it will be replaced in code
  prompt #"
    {{_.role("user")}}
    Extract from this content:
    {{ input }}

    {{ additional }}
    {{ ctx.output_format }}
  "#
}

function ExtractAudio(input: audio, additional: string) -> Dynamic {
  client "openai/gpt-4o" // This is a default, it will be replaced in code
  prompt #"
    {{_.role("user")}}
    Extract from this content:
    {{ input }}


    {{ additional }}
    {{ ctx.output_format }}
  "#
}
