import{t as e}from"./chunk-CRAtDASX.js";import{t}from"./chunk-Bv8uJLxf.js";var n=e(),r={title:`My static site got a tool loop — and maybe an agent`,publishing_date:`2026-09-15`,category:`ai`,secondaryCategory:`webdev`,description:`I wanted my chat assistant to answer a question about a real Bundestag session. Here is everything that has to happen between the question and the answer — and why all of it runs in your browser.`,tokenID:207},i=[{id:`browser`,labelLines:[`Browser`,`(the chat page)`]},{id:`endpoint`,labelLines:[`LLM endpoint`,`→ Mistral`]},{id:`bundestakt`,label:`Bundestakt`}],a=[{kind:`message`,from:`browser`,to:`endpoint`,label:`1. messages + tools`},{kind:`message`,from:`endpoint`,to:`browser`,label:`2. tool_calls: get_sitzungen`,style:`dashed`},{kind:`note`,from:`browser`,to:`browser`,label:`Nothing has happened yet`},{kind:`message`,from:`browser`,to:`bundestakt`,label:`3. GET /api/v1/sitzungen`},{kind:`message`,from:`bundestakt`,to:`browser`,label:`21 sessions, 74 KB`,style:`dashed`},{kind:`message`,from:`browser`,to:`endpoint`,label:`4. same array + tool result`},{kind:`message`,from:`endpoint`,to:`browser`,label:`the answer, in prose`,style:`dashed`}];function o(e){let r={a:`a`,code:`code`,em:`em`,h2:`h2`,h3:`h3`,li:`li`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)(r.p,{children:[`Over the last few months, I put together my little `,(0,n.jsx)(r.a,{href:`/assistent`,children:`chat assistant`}),`. It could talk, and that was all it could do. But I want it to be able to do two things (at least):`]}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsxs)(r.strong,{children:[`Talk to `,(0,n.jsx)(r.a,{href:`https://www.bundestakt.de`,children:`Bundestakt`})]}),`, an awesome website with a free API. It summarises Bundestag plenary sessions and fact-checks of what was claimed in the debates. Asking what happened in the session on 9 September should get an answer from the actual record over there, not from whatever the model invents.`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Make an image without leaving the chat.`}),` The `,(0,n.jsx)(r.a,{href:`/imagegen`,children:`image generator`}),` already had its own page. Describing a picture mid-conversation and then being sent somewhere else to get it is somehow clunky.`]}),`
`]}),`
`,(0,n.jsxs)(r.p,{children:[`For both, the Mistral model has to get outside information and I was unsure how this could work. I had only ever met tool calling from inside `,(0,n.jsx)(r.a,{href:`https://www.langchain.com/langgraph`,children:`LangGraph`}),`, in Python. There a tool call and a model call look like the same kind of thing — nodes in one graph, running in one process.`]}),`
`,(0,n.jsxs)(r.p,{children:[`And on this little website it was not clear how to get the information to the model. The website is based on `,(0,n.jsx)(r.a,{href:`https://vike.dev`,children:`Vike`}),` and statically built on deployment. Next to those files sit a handful of serverless functions — small pieces of code that wake up when something calls them and shut down again afterwards. One of them is the paid endpoint that talks to Mistral for me, and it will not help either: it passes my list of tools along to the model and hands the model's reply straight back, without ever running a tool itself.`]}),`
`,(0,n.jsx)(r.p,{children:`So the loop that collects the information has to run in the browser. Which, it turns out, is quite straight forward in modern React apps.`}),`
`,(0,n.jsx)(r.h2,{children:`The workflow`}),`
`,(0,n.jsxs)(r.p,{children:[`Let us walk through the mechanism with the following example. I want to ask my model `,(0,n.jsx)(r.em,{children:`"What did the Bundestag debate on 9 September?"`}),` and have the answer come from Bundestakt. Below is a sketch of the full flow, and the rest of the post walks through it step by step.`]}),`
`,(0,n.jsx)(t,{participants:i,steps:a,caption:`One turn. The browser is the only thing that ever calls Bundestakt; the model just asks it to.`}),`
`,(0,n.jsxs)(r.h3,{children:[`Step 1: Send the usual request, plus `,(0,n.jsx)(r.code,{children:`tools`})]}),`
`,(0,n.jsx)(r.p,{children:`When you chat with a model, you send it a list of messages — who said what, in order. Tool calling adds a second list next to the first one. I like to think of it as a menu: here are the things I can do for you, here is what each one is good for, and here is what you would have to fill in to order it.`}),`
`,(0,n.jsxs)(r.p,{children:[`The model itself cannot cook anything on that menu. It can only read it and tell me what it would like. Which means the `,(0,n.jsx)(r.code,{children:`description`}),` of each tool is really important: it is the only thing the model ever learns about a tool. Below you have a code snippet of how it looks in practice.`]}),`
`,(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:`language-bash`,children:`curl https://llm-agent.fretchen.eu -d '{
  "messages": [
    { "role": "user", "content": "What did the Bundestag debate on 9 September 2026?" }
  ],
  "tools": [{
    "type": "function",
    "function": {
      "name": "get_sitzungen",
      "description": "List Bundestag plenary sessions (Bundestakt), or fetch one session's full detail by slug. Call without a slug first to find the right session, then call again with its slug for details.",
      "parameters": { /* slug, plus von / bis as ISO dates to narrow the range */ }
    }
  }]
}'
`})}),`
`,(0,n.jsx)(r.h3,{children:`Step 2: The model requests the information from the tool`}),`
`,(0,n.jsxs)(r.p,{children:[`If the model thinks that it requires information from Bundestakt it will tell you so in its request answer. The reply still arrives in the same shape: a `,(0,n.jsx)(r.code,{children:`choices`}),` list, with a `,(0,n.jsx)(r.code,{children:`message`}),` inside it. Normally that message has `,(0,n.jsx)(r.code,{children:`content`}),`, the text you would read on screen. This time `,(0,n.jsx)(r.code,{children:`content`}),` is empty and a `,(0,n.jsx)(r.code,{children:`tool_calls`}),` list has taken its place. And `,(0,n.jsx)(r.code,{children:`finish_reason`}),`, the label saying why the model stopped talking, says `,(0,n.jsx)(r.code,{children:`"tool_calls"`}),` instead of the usual `,(0,n.jsx)(r.code,{children:`"stop"`}),`.`]}),`
`,(0,n.jsxs)(r.p,{children:[`The cool thing is that the model does not have to run the tool itself, it only tells us that it wants the specific item `,(0,n.jsx)(r.code,{children:`get_sitzungen`}),` from the tool menu. See the according code snippet of the answer below.`]}),`
`,(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:`language-json`,children:`{
  "choices": [
    {
      "finish_reason": "tool_calls",
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_a1b2c3d4",
            "type": "function",
            "function": {
              "name": "get_sitzungen",
              "arguments": "{\\"von\\": \\"2026-09-09\\", \\"bis\\": \\"2026-09-09\\"}"
            }
          }
        ]
      }
    }
  ]
}
`})}),`
`,(0,n.jsxs)(r.p,{children:[`Quite importantly, `,(0,n.jsx)(r.strong,{children:`the model has no memory`}),`. The only reason the assistant appears to remember anything is that I send the entire conversation again, from the beginning.`]}),`
`,(0,n.jsx)(r.h3,{children:`Step 3: The web app runs the tool to collect the information`}),`
`,(0,n.jsxs)(r.p,{children:[`This is for me the cool part of this little React app. The page just reads the request answer from the model, unpacks it and calls Bundestakt itself. An ordinary `,(0,n.jsx)(r.code,{children:`fetch`}),`, the same one any React component makes to load anything — from your browser, straight to `,(0,n.jsx)(r.code,{children:`bundestakt.de`}),`.`]}),`
`,(0,n.jsx)(r.p,{children:`Fetch the sessions, then keep only the few fields an answer actually needs:`}),`
`,(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:`language-typescript`,children:`// tools/bundestakt.ts
const res = await fetch("https://www.bundestakt.de/api/v1/sitzungen");
const { sitzungen } = await res.json();

return sitzungen.map((s) => ({
  slug: s.slug,
  datum: s.datum,
  kernthema: s.kernthema,
  schlagzeilen: s.in30Sekunden.map((p) => p.titel),
  url: s.url,
}));
`})}),`
`,(0,n.jsx)(r.p,{children:`Bundestakt sends 74 KB across 21 sessions; keeping only date, topic and headlines brings it to 7.3 KB. And since the whole conversation goes back to the model every time, a fat result is not paid for once — it is paid for again with every later message of the same turn.`}),`
`,(0,n.jsx)(r.h3,{children:`Step 4: Contact the model again, with the collected information`}),`
`,(0,n.jsxs)(r.p,{children:[`Now the same list of messages goes back to the same endpoint, with two things added to the end: the model's own order, handed back word for word, and the answer to it, tagged with the `,(0,n.jsx)(r.code,{children:`id`}),` the model gave that order. That answer is a third kind of message — not from the person, not from the model, but `,(0,n.jsx)(r.code,{children:`role: "tool"`}),`.`]}),`
`,(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:`language-json`,children:`{
  "messages": [
    { "role": "user", "content": "What did the Bundestag debate on 9 September 2026?" },
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [{ "id": "call_a1b2c3d4", "type": "function", "function": { "name": "get_sitzungen", "arguments": "{\\"von\\": \\"2026-09-09\\", \\"bis\\": \\"2026-09-09\\"}" } }]
    },
    {
      "role": "tool",
      "tool_call_id": "call_a1b2c3d4",
      "content": "{\\"status\\":\\"ok\\",\\"sitzungen\\":[{\\"slug\\":\\"21-92-2026-09-09\\",\\"datum\\":\\"2026-09-09\\",\\"kernthema\\":\\"Haushalt 2027 und der Schock von Sachsen-Anhalt\\",\\"schlagzeilen\\":[\\"Weidel greift an, Merz kontert\\",\\"140 Milliarden fuer Verteidigung\\",\\"Gekuerzt wird bei den Familien\\"],\\"url\\":\\"https://www.bundestakt.de/sitzung/21-92-2026-09-09\\"}]}"
    }
  ],
  "tools": [ ... same as before ... ]
}
`})}),`
`,(0,n.jsxs)(r.p,{children:[`Same endpoint, same shape as step 1. This time the model decides that it can answer and writes prose, `,(0,n.jsx)(r.code,{children:`finish_reason`}),` comes back as `,(0,n.jsx)(r.code,{children:`"stop"`}),`, and the turn is over.
If it had wanted the full record it would have ordered again, with `,(0,n.jsx)(r.code,{children:`slug`}),` this time, and the list would have grown by two more messages.`]}),`
`,(0,n.jsxs)(r.p,{children:[`This is the bit I had wrong for a long time: nothing is held open between the two sides. `,(0,n.jsx)(r.strong,{children:`The list just grows and gets sent again.`})]}),`
`,(0,n.jsxs)(r.p,{children:[`Which means the loop is a `,(0,n.jsx)(r.code,{children:`for`}),` loop with a `,(0,n.jsx)(r.code,{children:`break`}),` in it. Two things to watch: the list being pushed to at the bottom, and the `,(0,n.jsx)(r.code,{children:`break`}),` that fires the moment the model finally writes words instead of ordering something.`]}),`
`,(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:`language-typescript`,children:`for (let hop = 0; hop < MAX_HOPS; hop++) {
  const offered = offeredTools.filter((t) => !failedTools.has(t.function.name));

  const data = await payAndSend(convo, {
    tools: offered.length > 0 ? offered : undefined,
  });

  const choice = data.choices?.[0];
  const toolCalls = choice?.message.tool_calls;

  if (choice?.finish_reason !== "tool_calls" || !toolCalls?.length) {
    finalContent = choice?.message.content ?? null;
    break;
  }

  convo.push(choice.message); // the assistant turn: content null, tool_calls intact

  for (const call of toolCalls) {
    const { result, recoverable } = await runToolCall(call);
    if (result.status !== "ok" && !recoverable) {
      failedTools.add(call.function.name);
    }
    convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
  }
}
`})}),`
`,(0,n.jsxs)(r.p,{children:[`That is `,(0,n.jsx)(r.a,{href:`https://github.com/fretchen/fretchen.github.io/blob/main/website/utils/toolLoop.ts`,children:`the real one`}),`, minus its comments. One trip round that loop is a `,(0,n.jsx)(r.strong,{children:`hop`}),` — one journey to the model and back, paid for separately from the last. `,(0,n.jsx)(r.code,{children:`MAX_HOPS`}),` is 4, because a model that never stops ordering would otherwise bill me in a circle. Four is not a principle; it is the smallest number that fits the longest flow I have, which is list → detail → answer with one hop spare.`]}),`
`,(0,n.jsx)(r.h2,{children:`Four tools, two shapes`}),`
`,(0,n.jsx)(r.p,{children:`I have added four tools by now.`}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:(0,n.jsx)(r.code,{children:`get_sitzungen`})}),` — lists Bundestag plenary sessions, or fetches one session in full.`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:(0,n.jsx)(r.code,{children:`search_claims`})}),` — searches fact-checked statements MPs made in debates, with the verdict.`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:(0,n.jsx)(r.code,{children:`get_analytics`})}),` — this site's own visitor numbers. Only I can use this one.`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:(0,n.jsx)(r.code,{children:`generate_image`})}),` — makes a picture from a description, for seven cents.`]}),`
`]}),`
`,(0,n.jsx)(r.p,{children:`The first three are all the same shape: fetch something, throw most of it away, hand back the rest.`}),`
`,(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.code,{children:`generate_image`}),` is a bit more complex, because it spends real money — so the model ordering it does not make it happen. Instead, the code puts a confirmation card on screen with the prompt, the size and the price, and then the loop simply stops at that line and waits. It can wait indefinitely. Whatever the person decides — confirm, rewrite the prompt, cancel — comes back to the model as a status like `,(0,n.jsx)(r.code,{children:`user_declined`}),`, and the model writes the sentence explaining it.`]}),`
`,(0,n.jsx)(r.h2,{children:`How fancy is this ? Is this an agent? Do I need MCP?`}),`
`,(0,n.jsx)(r.p,{children:`Given the addition of decision logic I wonder, if this is already a little agent. On one hand, it picks whether to act, which tool to use, and what to fill in. It reads the result and decides what comes next. It chains: find the session, fetch its detail, then answer. By most working definitions that is an agent.`}),`
`,(0,n.jsx)(r.p,{children:`On the other hand, it also forgets everything the moment the turn ends. Those tool messages live in a list that exists only while one message is being answered, and then it is thrown away — so the model's own closing sentence is its entire memory of having generated an image. It follows no plan that my code owns. It stops after four hops. And the whole thing is about forty lines.`}),`
`,(0,n.jsx)(r.p,{children:`So, it is likely a baby agent...`}),`
`,(0,n.jsxs)(r.p,{children:[`Interestingly, the whole `,(0,n.jsx)(r.a,{href:`https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro`,children:`MCP`}),` seems to be over-engineering for me at this stage. From what I understand, it is an agreed format for describing tools and reaching them, so that a tool written by one person can plug into a chat program written by another. Nice standard, but not clear that it is helpful here.`]}),`
`,(0,n.jsx)(r.h2,{children:`Where that leaves it`}),`
`,(0,n.jsxs)(r.p,{children:[`In summary, the assistant can now look up a Bundestag session and get the required information without leaving the chat. Both of those turned out to be the same `,(0,n.jsx)(r.code,{children:`for`}),` loop, running in a tab, on a site that is nothing but files on a server.`]}),`
`,(0,n.jsxs)(r.p,{children:[`It runs on `,(0,n.jsx)(r.a,{href:`/assistent`,children:`the assistant page`}),` if you want to watch a list grow.`]})]})}function s(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(o,{...e})}):o(e)}export{s as default,r as frontmatter,i as turnParticipants,a as turnSteps};