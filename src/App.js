import React from 'react'
import './App.css'
import { useQuery, useMutation, queryCache } from 'react-query'
import { ReactQueryDevtools } from 'react-query-devtools'

const API_BASE_URL = 'http://localhost:3000'

function App() {
  const [activePostId, setActivePostId] = React.useState()

  return (
    <div className="App">
      <header className="App-header">
        <h3>Async data made simple with react-query</h3>
      </header>

      {activePostId ? (
        <Post activePostId={activePostId} setActivePostId={setActivePostId} />
      ) : (
        <Posts setActivePostId={setActivePostId} />
      )}
      <ReactQueryDevtools />
    </div>
  )
}

function Posts({ setActivePostId }) {
  const { status, data, error, isFetching } = useQuery('posts', async () => {
    const postsData = await (await fetch(`${API_BASE_URL}/posts`)).json()
    return postsData
  })

  const [onSubmit] = useMutation(
    async (values) => {
      await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        body: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    },
    {
      onMutate: (newPost) => {
        const previousPosts = queryCache.getQueryData('posts')

        queryCache.setQueryData('posts', (old) => [...old, newPost])

        return () => queryCache.setQueryData('posts', previousPosts)
      },
      onError: (error, newPost, rollback) => {
        rollback()
      },
      onSettled: () => queryCache.refetchQueries('posts'),
    }
  )

  return (
    <section>
      <div>
        <h3>Posts {isFetching ? 'Updating...' : null}</h3>
        <div>
          {status === 'loading' ? (
            <span>Loading...</span>
          ) : status === 'error' ? (
            <span>Error: {error.message}</span>
          ) : (
            // also status === 'success', but "else" logic works, too
            <ul>
              {[...data]
                .sort((a, b) => (a.title > b.title ? 1 : -1))
                .map((post) => (
                  <div key={post.id}>
                    <a href="#" onClick={() => setActivePostId(post.id)}>
                      {post.title}
                    </a>
                  </div>
                ))}
            </ul>
          )}
        </div>
      </div>
      <div>
        <h3>Create New Post</h3>
        <div>
          <CreatePostForm onSubmit={onSubmit} />
        </div>
      </div>
    </section>
  )
}

function Post({ activePostId, setActivePostId }) {
  const [isEditing, setIsEditing] = React.useState(false)

  const { status, data: post, error, isFetching } = useQuery(
    ['post', activePostId],
    async () => {
      const postsData = await (
        await fetch(`${API_BASE_URL}/posts/${activePostId}`)
      ).json()

      return postsData
    }
  )

  const [onSubmit] = useMutation(
    async (values) => {
      const response = await fetch(`${API_BASE_URL}/posts/${values.id}`, {
        method: 'PATCH',
        body: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    },
    {
      onMutate: (newPost) => {
        const previousPost = queryCache.getQueryData(['post', newPost.id])

        queryCache.setQueryData(['post', newPost.id], newPost)

        return () => queryCache.setQueryData[('post', newPost.id)], previousPost
      },
      onError: (error, newPost, rollback) => {
        rollback()
      },
      onSettled: (data, error, newPost) => {
        queryCache.refetchQueries('posts')
        queryCache.refetchQueries(['post', newPost.id])
      },
    }
  )

  return status === 'loading' ? (
    <span>Loading...</span>
  ) : status === 'error' ? (
    <span>Error: {error.message}</span>
  ) : (
    <div>
      <div onClick={() => setActivePostId()}>
        <a href="#">{'<'} Back</a>
      </div>
      <br />
      <h3>
        {post.title} {isFetching ? 'Updating...' : null}
      </h3>
      <div>
        <p>{post.content}</p>
      </div>
      <button onClick={() => setIsEditing((old) => !old)}>Edit</button>

      {isEditing ? (
        <CreatePostForm
          initialValues={{
            ...post,
            publishedAt: new Date(post.publishedAt).toISOString().split('T')[0],
          }}
          onSubmit={onSubmit}
        />
      ) : null}
    </div>
  )
}

const defaultFormValues = () => ({
  title: '',
  publishedAt: new Date().toISOString().split('T')[0],
  content: '',
})

function CreatePostForm({ onSubmit, initialValues = defaultFormValues }) {
  const [values, setValues] = React.useState(initialValues)

  const setValue = (field, value) =>
    setValues((old) => ({ ...old, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(values)
    setValues(defaultFormValues)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Title</label>
        <input
          type="text"
          name="title"
          value={values.title}
          onChange={(e) => setValue('title', e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="content">Publish Date</label>
        <input
          type="date"
          name="publishedAt"
          value={values.publishedAt}
          onChange={(e) =>
            setValue('publishedAt', new Date(e.target.value).toISOString())
          }
          required
        />
      </div>
      <div>
        <label htmlFor="content">Content</label>
        <textarea
          type="text"
          name="content"
          value={values.content}
          onChange={(e) => setValue('content', e.target.value)}
          required
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  )
}

export default App
