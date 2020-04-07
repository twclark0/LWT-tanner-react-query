import shortid from 'shortid'

//

import corsMiddleware from '../../../utils/corsMiddleware'
import Airtable from '../../../utils/Airtable'

const table = Airtable('posts')

export default async (req, res) => {
  await corsMiddleware(req, res)

  try {
    if (req.method === 'GET') {
      return await GET(req, res)
    } else if (req.method === 'POST') {
      return await POST(req, res)
    }
  } catch (err) {
    console.error(err)
    res.status(500)
    res.json({ message: 'An unknown error occurred!' })
  }
}

async function GET(req, res) {
  const {
    query: { pageOffset, pageSize },
  } = req

  const data = await (
    await table.select({
      fields: ['id', 'title', 'publishedAt'],
    })
  ).all()

  const posts = data.map((d) => d.fields)

  if (Number(pageSize)) {
    const start = Number(pageSize) * Number(pageOffset)
    const end = start + Number(pageSize)
    const page = posts.slice(start, end)

    return res.json({
      items: page,
      nextPageOffset: posts.length > end ? Number(pageOffset) + 1 : undefined,
    })
  }

  res.json(posts)
}

async function POST(req, res) {
  const [row] = await table.create([
    {
      fields: {
        id: shortid.generate(),
        ...req.body,
      },
    },
  ])

  res.json(row.fields)
}
