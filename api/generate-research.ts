import { client, send, sendError, readBody } from './_shared'
import type { IncomingMessage, ServerResponse } from 'http'

const SYSTEM_PROMPT = (country: string, committee: string, topic: string) =>
  `You are an expert Model United Nations research agent. Your task is to conduct comprehensive research for a delegate representing ${country} in a Model United Nations conference.

Research and compile the following:

## 1. COUNTRY PROFILE
- Government structure, current leadership, and political stability
- Key economic indicators (GDP, major industries, unemployment, poverty rate)
- Demographics, ethnic groups, and official/spoken languages
- Recent major news or developments (last 12 months)

## 2. FOREIGN POLICY & ALLIANCES
- ${country}'s foreign policy priorities and doctrine
- Key bilateral relationships and regional alliances
- Relationship with major powers (USA, China, UK, Russia)
- Stance on multilateralism and the United Nations

## 3. COMMITTEE-SPECIFIC RESEARCH
- Committee: ${committee}
${topic ? `- Topic: ${topic}` : ''}
- ${country}'s official position or voting history on this topic
- Any resolutions ${country} has co-sponsored related to this topic
- Domestic relevance of this topic to ${country}
- Key arguments ${country} would likely make on the floor

## 4. HISTORICAL CONTEXT
- ${country}'s history with the UN (peacekeeping, aid, partnerships)
- Past conflicts or crises and their lasting impact on foreign policy
- Any international agreements or treaties ${country} has signed relevant to this topic

## 5. BLOC ALIGNMENT
- Which country blocs ${country} typically aligns with
- Potential allies on this specific committee topic
- Countries ${country} may oppose and why

## 6. DELEGATE TOOLKIT
- 3-5 strong opening speech talking points
- Likely amendments or clauses ${country} would push for
- Red lines — positions ${country} would strongly oppose
- 5 potential working paper allies to approach

Format the output as a structured briefing document.
Use credible sources: UN databases, government websites, BBC, Reuters,
Council on Foreign Relations, and academic sources.
Cite sources where possible.`

export default async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  try {
    const { country, committee, topic } = await readBody(req)
    const completion = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(country, committee, topic) },
        { role: 'user', content: topic
          ? `Generate a comprehensive research briefing for ${country} on ${topic} for ${committee}.`
          : `Generate a comprehensive research briefing for ${country} for ${committee}.` },
      ],
    })
    return send(res, { content: completion.choices[0].message.content })
  } catch (e: any) {
    return sendError(res, e.message)
  }
}
