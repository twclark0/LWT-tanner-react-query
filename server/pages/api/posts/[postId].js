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
    } else if (req.method === 'PATCH') {
      return await PATCH(req, res)
    } else if (req.method === 'DELETE') {
      return await DELETE(req, res)
    }
  } catch (err) {
    console.error(err)
    res.status(500)
    res.json({ message: 'An unknown error occurred!' })
  }
}

async function GET(req, res) {
  const {
    query: { postId },
  } = req

  const row = await getPostById(postId)

  if (!row) {
    res.status(404)
    return res.send('Not found')
  }

  res.json(row.fields)
}

async function PATCH(req, res) {
  const {
    query: { postId },
    body,
  } = req

  const row = await getPostById(postId)

  if (!row) {
    res.status(404)
    return res.send('Not found')
  }

  const updatedRow = await row.updateFields(body)

  res.json(updatedRow.fields)
}

async function DELETE(req, res) {
  const {
    query: { postId },
  } = req

  const row = await getPostById(postId)

  if (!row) {
    res.status(404)
    return res.send('Not found')
  }

  await row.destroy()

  res.status(200)
  res.send('Resource Deleted')
}

async function getPostById(id) {
  const [row] = await (
    await table.select({
      filterByFormula: `({id} = '${id}')`,
    })
  ).all()

  return row
}
