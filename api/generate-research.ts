import { callDeepSeek, send, sendError, readBody } from './_shared.js'
import type { IncomingMessage, ServerResponse } from 'http'

const SYSTEM_PROMPT = (country: string, committee: string, topic: string) =>
  `You are an expert Model United Nations research agent. Your task is to conduct comprehensive research for a delegate representing ${country} in a Model United Nations conference.

Generate JSON matching this schema exactly:
{
  "sections": [
    {
      "title": "Country Profile",
      "items": [
        { "label": "Government Structure", "content": "...", "list": [] },
        { "label": "Key Economic Indicators", "content": "...", "list": [] }
      ]
    }
  ]
}

Research and compile the following sections:

Section 1: "Country Profile"
- Government structure, current leadership, and political stability
- Key economic indicators (GDP, major industries, unemployment, poverty rate)
- Demographics, ethnic groups, and official/spoken languages
- Recent major news or developments (last 12 months)

Section 2: "Foreign Policy & Alliances"
- ${country}'s foreign policy priorities and doctrine
- Key bilateral relationships and regional alliances
- Relationship with major powers (USA, China, UK, Russia)
- Stance on multilateralism and the United Nations

Section 3: "Committee-Specific Research"
- Committee: ${committee}
${topic ? `- Topic: ${topic}` : ''}
- ${country}'s official position or voting history on this topic
- Any resolutions ${country} has co-sponsored related to this topic
- Domestic relevance of this topic to ${country}
- Key arguments ${country} would likely make on the floor

Section 4: "Historical Context"
- ${country}'s history with the UN (peacekeeping, aid, partnerships)
- Past conflicts or crises and their lasting impact on foreign policy
- Any international agreements or treaties ${country} has signed relevant to this topic

Section 5: "Bloc Alignment"
- Which country blocs ${country} typically aligns with
- Potential allies on this specific committee topic
- Countries ${country} may oppose and why

Section 6: "Delegate Toolkit"
- An array of 3-5 strong opening speech talking points under label "Opening Speech Talking Points" with each as a list item
- Likely amendments or clauses under "Likely Amendments"
- Red lines under "Red Lines" with each as a list item
- 5 potential working paper allies under "Working Paper Allies" with each as a list item

Each item can have a "list" field containing bullet points. If no list is needed, set it to an empty array.
Use credible sources: UN databases, government websites, BBC, Reuters,
Council on Foreign Relations, and academic sources.
Cite sources inline within the content field.`

export default async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  try {
    const { country, committee, topic } = await readBody(req)
    const content = await callDeepSeek([
      { role: 'system', content: SYSTEM_PROMPT(country, committee, topic) },
      { role: 'user', content: topic
        ? `Generate research JSON for ${country} on ${topic} for ${committee}.`
        : `Generate research JSON for ${country} for ${committee}.` },
    ], { json: true })
    return send(res, JSON.parse(content))
  } catch (e: any) {
    return sendError(res, e.message)
  }
}
