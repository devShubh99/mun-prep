import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

const SYSTEM_PROMPT = (country: string, committee: string, topic: string) =>
  `You are an expert Model United Nations research agent. Your task is to conduct comprehensive research for a delegate representing ${country} in a Model United Nations conference on ${topic} in ${committee}.

Research and compile the following:

1. COUNTRY PROFILE
Government structure, current leadership, and political stability
Key economic indicators (GDP, major industries, unemployment, poverty rate)
Demographics, ethnic groups, and official/spoken languages
Recent major news or developments (last 12 months)

2. FOREIGN POLICY & ALLIANCES
${country}'s foreign policy priorities and doctrine
Key bilateral relationships and regional alliances
Relationship with major powers (USA, China, UK, Russia)
Stance on multilateralism and the United Nations

3. COMMITTEE-SPECIFIC RESEARCH
Committee: ${committee} | Topic: ${topic}
${country}'s official position or voting history on this topic
Any resolutions ${country} has co-sponsored related to this topic
Domestic relevance of this topic to ${country}
Key arguments ${country} would likely make on the floor

4. HISTORICAL CONTEXT
${country}'s history with the UN (peacekeeping, aid, partnerships)
Past conflicts or crises and their lasting impact
Any international agreements or treaties ${country} has signed

5. BLOC ALIGNMENT
Which country blocs ${country} typically aligns with
Potential allies on this specific committee topic
Countries ${country} may oppose and why

6. DELEGATE TOOLKIT
3-5 strong opening speech talking points
Likely amendments or clauses ${country} would push for
Red lines — positions ${country} would strongly oppose
5 potential working paper allies to approach

Format as a structured briefing document with HTML headings and paragraphs. Use <h2>, <h3>, <ul>, <p> tags.`

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { country, committee, topic } = JSON.parse(event.body || '{}')
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(country, committee, topic) },
        { role: 'user', content: `Generate comprehensive research briefing for ${country} on ${topic} in ${committee}.` },
      ],
    })
    return ok({ content: response.choices[0].message.content })
  } catch (e: any) {
    return error(500, e.message)
  }
}
