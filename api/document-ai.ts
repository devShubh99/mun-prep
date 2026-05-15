import { client, json } from './shared'

const ACTIONS: Record<string, string> = {
  polish: 'Polish the text to make it more diplomatic and professional. Return only the polished text.',
  shorten: 'Shorten the text to half its length while keeping all key points. Return only the shortened text.',
  brainstorm: 'Brainstorm additional points, arguments, or clauses the delegate could add. Return only the new content, no prefix.',
  'insert-clause': 'Draft a formal working clause on this topic. Return only the clause text.',
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const { action, documentType, content, context } = await req.json()
    const instruction = ACTIONS[action] || ACTIONS.polish
    const completion = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: `${instruction}\nDocument type: ${documentType}\n${context ? `Context: ${context}` : ''}` },
        { role: 'user', content },
      ],
    })
    return json({ result: completion.choices[0].message.content?.trim() })
  } catch (e: any) {
    return json({ error: e.message }, 500)
  }
}
