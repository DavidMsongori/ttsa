
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './ContactMessages.css'

const PAGE_SIZE = 10
const SENDER_EMAIL = 'studentsttsa@gmail.com'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

const CATEGORY_OPTIONS = [
  'Membership',
  'Student Welfare',
  'Leadership',
  'Programs',
  'Partnerships',
  'Media & Communications',
  'General Enquiry',
]

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getStatusLabel(status) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label || status
}

function openGmailReply(message) {
  if (!message?.email) {
    window.alert('This enquiry does not have an email address.')
    return
  }

  const recipient = message.email.trim()
  const subject = `Re: ${message.subject || 'TTSA Contact Enquiry'}`

  const body = [
    `Dear ${message.full_name || 'Student'},`,
    '',
    'Thank you for contacting the Taita Taveta Students Association (TTSA).',
    '',
    '',
    'Kind regards,',
    'TTSA Student Support',
    SENDER_EMAIL,
  ].join('\n')

  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: recipient,
    su: subject,
    body,
  })

  const gmailUrl = `https://mail.google.com/mail/?${params.toString()}`

  window.open(gmailUrl, '_blank', 'noopener,noreferrer')
}

export default function ContactMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadMessages = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('ttsa_contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setMessages([])
    } else {
      setMessages(data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const filteredMessages = messages.filter((message) => {
    const term = search.trim().toLowerCase()

    const matchesSearch =
      !term ||
      [
        message.full_name,
        message.email,
        message.phone,
        message.subject,
        message.message,
        message.category,
      ].some((value) => String(value || '').toLowerCase().includes(term))

    const matchesStatus =
      statusFilter === 'all' || message.status === statusFilter

    const matchesCategory =
      categoryFilter === 'all' || message.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMessages.length / PAGE_SIZE),
  )
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const visibleMessages = filteredMessages.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  )

  const counts = {
    total: messages.length,
    new: messages.filter((item) => item.status === 'new').length,
    inProgress: messages.filter((item) => item.status === 'in_progress').length,
    resolved: messages.filter((item) => item.status === 'resolved').length,
  }

  async function updateStatus(message, status) {
    if (message.status === status) return

    setSavingId(message.id)
    setError('')
    setNotice('')

    const { data, error: updateError } = await supabase
      .from('ttsa_contact_messages')
      .update({ status })
      .eq('id', message.id)
      .select()
      .single()

    if (updateError) {
      setError(`Unable to update message: ${updateError.message}`)
    } else {
      setMessages((current) =>
        current.map((item) => (item.id === message.id ? data : item)),
      )

      setSelectedMessage((current) =>
        current?.id === message.id ? data : current,
      )

      setNotice('Message status updated successfully.')
    }

    setSavingId(null)
  }

  async function deleteMessage(message) {
    const confirmed = window.confirm(
      `Permanently delete the enquiry from ${message.full_name}? This cannot be undone.`,
    )

    if (!confirmed) return

    setDeletingId(message.id)
    setError('')
    setNotice('')

    const { error: deleteError } = await supabase
      .from('ttsa_contact_messages')
      .delete()
      .eq('id', message.id)

    if (deleteError) {
      setError(`Unable to delete message: ${deleteError.message}`)
    } else {
      setMessages((current) =>
        current.filter((item) => item.id !== message.id),
      )

      setSelectedMessage((current) =>
        current?.id === message.id ? null : current,
      )

      setNotice('Message deleted successfully.')
    }

    setDeletingId(null)
  }

  function handleFilterChange(setter, value) {
    setter(value)
    setPage(1)
  }

  return (
    <div className="contact-admin">
      <header className="contact-admin-header">
        <div>
          <p className="contact-admin-eyebrow">COMMUNICATIONS</p>
          <h1>Contact Messages</h1>
          <p className="contact-admin-description">
            Review enquiries, respond to stakeholders, and track their progress.
          </p>
        </div>

        <button
          type="button"
          className="contact-refresh-button"
          onClick={loadMessages}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '↻ Refresh messages'}
        </button>
      </header>

      {error && (
        <div className="contact-admin-alert error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="contact-admin-alert success" role="status">
          {notice}
        </div>
      )}

      <section className="contact-admin-stats" aria-label="Message statistics">
        <article className="contact-stat-card">
          <span>Total enquiries</span>
          <strong>{counts.total}</strong>
        </article>
        <article className="contact-stat-card">
          <span>New</span>
          <strong>{counts.new}</strong>
        </article>
        <article className="contact-stat-card">
          <span>In progress</span>
          <strong>{counts.inProgress}</strong>
        </article>
        <article className="contact-stat-card">
          <span>Resolved</span>
          <strong>{counts.resolved}</strong>
        </article>
      </section>

      <section className="contact-admin-panel">
        <div className="contact-admin-toolbar">
          <input
            type="search"
            placeholder="Search name, email, subject..."
            value={search}
            onChange={(event) =>
              handleFilterChange(setSearch, event.target.value)
            }
            aria-label="Search contact messages"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              handleFilterChange(setStatusFilter, event.target.value)
            }
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(event) =>
              handleFilterChange(setCategoryFilter, event.target.value)
            }
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="contact-admin-results">
          {loading ? (
            <p className="contact-admin-empty">Loading contact messages...</p>
          ) : error && messages.length === 0 ? (
            <p className="contact-admin-empty">
              Messages could not be loaded. Check your administrator access and
              try again.
            </p>
          ) : filteredMessages.length === 0 ? (
            <div className="contact-admin-empty">
              <span className="contact-empty-icon">✉</span>
              <h3>No messages found</h3>
              <p>
                New enquiries submitted through the public Contact page will
                appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="contact-table-wrap">
                <table className="contact-admin-table">
                  <thead>
                    <tr>
                      <th>Sender</th>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Received</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleMessages.map((message) => (
                      <tr key={message.id}>
                        <td>
                          <div className="contact-sender-name">
                            {message.full_name}
                          </div>
                          <a href={`mailto:${message.email}`}>
                            {message.email}
                          </a>
                        </td>

                        <td className="contact-subject-cell">
                          {message.subject || 'No subject'}
                        </td>

                        <td>{message.category}</td>
                        <td>{formatDate(message.created_at)}</td>

                        <td>
                          <span
                            className={`contact-status status-${message.status}`}
                          >
                            {getStatusLabel(message.status)}
                          </span>
                        </td>

                        <td>
                          <div className="contact-row-actions">
                            <button
                              type="button"
                              className="contact-action-button"
                              onClick={() => setSelectedMessage(message)}
                            >
                              View
                            </button>

                            <button
                              type="button"
                              className="contact-action-button danger"
                              onClick={() => deleteMessage(message)}
                              disabled={deletingId === message.id}
                            >
                              {deletingId === message.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="contact-pagination">
                <span>
                  Showing {startIndex + 1}–
                  {Math.min(startIndex + PAGE_SIZE, filteredMessages.length)} of{' '}
                  {filteredMessages.length}
                </span>

                <div className="contact-pagination-controls">
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>

                  <span>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {selectedMessage && (
        <div
          className="contact-message-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedMessage(null)
            }
          }}
        >
          <section
            className="contact-message-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-message-title"
          >
            <header className="contact-message-modal-header">
              <div>
                <p className="contact-admin-eyebrow">ENQUIRY DETAILS</p>
                <h2 id="contact-message-title">
                  {selectedMessage.subject || 'Contact enquiry'}
                </h2>
              </div>

              <button
                type="button"
                className="contact-modal-close"
                onClick={() => setSelectedMessage(null)}
                aria-label="Close message"
              >
                ×
              </button>
            </header>

            <div className="contact-message-details">
              <div>
                <span>From</span>
                <strong>{selectedMessage.full_name}</strong>
              </div>
              <div>
                <span>Email</span>
                <a href={`mailto:${selectedMessage.email}`}>
                  {selectedMessage.email}
                </a>
              </div>
              <div>
                <span>Phone</span>
                <strong>{selectedMessage.phone || 'Not provided'}</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>{selectedMessage.category || 'General Enquiry'}</strong>
              </div>
              <div>
                <span>Received</span>
                <strong>{formatDate(selectedMessage.created_at)}</strong>
              </div>
            </div>

            <div className="contact-message-body">
              <h3>Student's message</h3>
              <p>{selectedMessage.message}</p>
            </div>

            <div className="contact-message-management">
              <label htmlFor="contact-message-status">Update status</label>
              <select
                id="contact-message-status"
                value={selectedMessage.status || 'new'}
                onChange={(event) =>
                  updateStatus(selectedMessage, event.target.value)
                }
                disabled={savingId === selectedMessage.id}
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              {savingId === selectedMessage.id && (
                <span className="contact-saving-label">Saving...</span>
              )}
            </div>

            <div className="contact-reply-note">
              <span className="contact-reply-note-icon">✉</span>
              <div>
                <strong>Reply using TTSA Gmail</strong>
                <p>
                  Gmail will open with the student's address and a suggested
                  response. Review and send the email in Gmail.
                </p>
                <span>{SENDER_EMAIL}</span>
              </div>
            </div>

            <footer className="contact-message-modal-footer">
              <button
                type="button"
                className="contact-reply-button"
                onClick={() => openGmailReply(selectedMessage)}
                disabled={!selectedMessage.email}
              >
                ✉ Reply via Gmail <span aria-hidden="true">↗</span>
              </button>

              <button
                type="button"
                className="contact-action-button"
                onClick={() => setSelectedMessage(null)}
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}
