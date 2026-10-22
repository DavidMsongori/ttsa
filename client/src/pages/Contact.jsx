import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Contact.css'

const CATEGORIES = [
  'Membership',
  'Student Welfare',
  'Leadership',
  'Programs',
  'Partnerships',
  'Media & Communications',
  'General Enquiry',
]

const INITIAL_FORM = {
  full_name: '',
  email: '',
  phone: '',
  category: 'General Enquiry',
  subject: '',
  message: '',
}

const FAQS = [
  {
    question: 'How can I become a TTSA member?',
    answer:
      'Contact us through this form and select Membership. Our team can guide you on the applicable membership process.',
  },
  {
    question: 'How can I raise a student welfare concern?',
    answer:
      'Select Student Welfare and describe your concern clearly. Please avoid including passwords, identification documents, or other unnecessary sensitive information.',
  },
  {
    question: 'Can an organisation partner with TTSA?',
    answer:
      'Yes. Select Partnerships and tell us about your organisation, proposed collaboration, and the students or communities you hope to support.',
  },
  {
    question: 'How can I learn about TTSA programs?',
    answer:
      'Visit the Programs & Initiatives page on our website, or select Programs in this form if you have a specific question.',
  },
]

export default function Contact() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({
    type: '',
    message: '',
  })

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    if (feedback.message) {
      setFeedback({ type: '', message: '' })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting) return

    setSubmitting(true)
    setFeedback({ type: '', message: '' })

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      category: form.category,
      subject: form.subject.trim(),
      message: form.message.trim(),
    }

    try {
      const { error } = await supabase
        .from('ttsa_contact_messages')
        .insert([payload])

      if (error) {
        throw error
      }

      setForm({ ...INITIAL_FORM })

      setFeedback({
        type: 'success',
        message:
          'Thank you for contacting TTSA. Your enquiry has been submitted successfully.',
      })
    } catch (error) {
      console.error('Contact form submission failed:', error)

      setFeedback({
        type: 'error',
        message:
          'We could not submit your enquiry. Please check your connection and try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ttsa-contact-page">
      {/* HERO */}
      <section className="contact-hero">
        <div className="contact-hero-inner">
          <span className="contact-eyebrow">
            <span className="contact-eyebrow-line" />
            LET'S CONNECT
            <span className="contact-eyebrow-line" />
          </span>

          <h1>
            Your voice.
            <br />
            <span>Our commitment.</span>
          </h1>

          <p>
            Have a question, an idea, or a concern? We are here to listen.
            Reach out to the Taita Taveta Students Association and let us
            work together towards a better student experience.
          </p>

          <a href="#contact-form" className="contact-hero-button">
            Send us a message
            <span aria-hidden="true">↓</span>
          </a>

          <div className="contact-hero-note">
            <span className="contact-online-dot" />
            Connecting students. Supporting opportunities. Building community.
          </div>
        </div>
      </section>

      {/* CONTACT INTRODUCTION */}
      <section className="contact-intro">
        <div className="contact-container">
          <div className="contact-intro-copy">
            <span className="contact-section-eyebrow">WE'RE HERE TO HELP</span>
            <h2>
              Let's start a
              <span> conversation.</span>
            </h2>
            <p>
              Whether you are a student seeking support, a partner exploring
              collaboration, or a stakeholder with an idea for our community,
              your message matters to us.
            </p>
          </div>

          <div className="contact-promise">
            <span className="contact-promise-icon" aria-hidden="true">
              ↗
            </span>
            <div>
              <strong>Every conversation counts</strong>
              <p>
                Share your enquiry with us, and help us understand how TTSA
                can better serve students across Taita Taveta County.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FORM AND ENQUIRY INFORMATION */}
      <section className="contact-main-section" id="contact-form">
        <div className="contact-container">
          <div className="contact-main-grid">
            <aside className="contact-sidebar">
              <span className="contact-section-eyebrow">
                GET IN TOUCH
              </span>

              <h2>
                How can we
                <span> help you?</span>
              </h2>

              <p className="contact-sidebar-description">
                Choose the category that best describes your enquiry and
                provide enough detail for our team to understand how to assist.
              </p>

              <div className="contact-info-list">
                <article className="contact-info-item">
                  <span className="contact-info-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="m4 7 8 6 8-6"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <strong>General enquiries</strong>
                    <p>
                      Questions, feedback, and information about TTSA.
                    </p>
                  </div>
                </article>

                <article className="contact-info-item">
                  <span className="contact-info-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 21s7-4.8 7-11a7 7 0 1 0-14 0c0 6.2 7 11 7 11Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="10"
                        r="2.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                    </svg>
                  </span>
                  <div>
                    <strong>Student community</strong>
                    <p>
                      Membership, welfare, leadership, and student initiatives.
                    </p>
                  </div>
                </article>

                <article className="contact-info-item">
                  <span className="contact-info-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 3 14.8 8.7 21 9.6l-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <strong>Partnerships & opportunities</strong>
                    <p>
                      Collaboration, programs, and opportunities for students.
                    </p>
                  </div>
                </article>
              </div>

              <div className="contact-sidebar-note">
                <span aria-hidden="true">✦</span>
                <p>
                  <strong>Help us serve you better.</strong>
                  <br />
                  Please provide accurate contact details so you can be reached
                  if follow-up is necessary.
                </p>
              </div>
            </aside>

            <div className="contact-form-card">
              <div className="contact-form-heading">
                <span className="contact-section-eyebrow">
                  CONTACT FORM
                </span>
                <h2>Send us a message</h2>
                <p>
                  Complete the form below. Fields marked with * are required.
                </p>
              </div>

              {feedback.message && (
                <div
                  className={`contact-feedback contact-feedback-${feedback.type}`}
                  role={feedback.type === 'error' ? 'alert' : 'status'}
                  aria-live="polite"
                >
                  <span aria-hidden="true">
                    {feedback.type === 'success' ? '✓' : '!'}
                  </span>
                  <p>{feedback.message}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="contact-form-row">
                  <div className="contact-field">
                    <label htmlFor="contact-full-name">
                      Full name <span>*</span>
                    </label>
                    <input
                      id="contact-full-name"
                      type="text"
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      minLength={2}
                      maxLength={120}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="contact-email">
                      Email address <span>*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      maxLength={254}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="contact-form-row">
                  <div className="contact-field">
                    <label htmlFor="contact-phone">
                      Phone number <span className="contact-optional">(optional)</span>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+254 7XX XXX XXX"
                      autoComplete="tel"
                      maxLength={30}
                      disabled={submitting}
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="contact-category">
                      Enquiry category <span>*</span>
                    </label>
                    <select
                      id="contact-category"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      required
                      disabled={submitting}
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-subject">
                    Subject <span>*</span>
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="What would you like to discuss?"
                    minLength={3}
                    maxLength={180}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="contact-message">
                    Your message <span>*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    minLength={10}
                    maxLength={10000}
                    rows={6}
                    required
                    disabled={submitting}
                  />
                  <span className="contact-field-hint">
                    Please provide at least 10 characters.
                  </span>
                </div>

                <p className="contact-privacy-note">
                  By submitting this form, you agree that TTSA may use the
                  information you provide to respond to your enquiry. Please
                  do not include passwords or unnecessary sensitive personal
                  information.
                </p>

                <button
                  type="submit"
                  className="contact-submit-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="contact-spinner" aria-hidden="true" />
                      Submitting your message...
                    </>
                  ) : (
                    <>
                      Submit enquiry
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="contact-faq-section">
        <div className="contact-container">
          <div className="contact-faq-heading">
            <span className="contact-section-eyebrow">
              QUICK ANSWERS
            </span>
            <h2>
              Frequently asked
              <span> questions.</span>
            </h2>
            <p>
              Find answers to common questions about reaching and engaging
              with TTSA.
            </p>
          </div>

          <div className="contact-faq-list">
            {FAQS.map((faq, index) => (
              <details className="contact-faq-item" key={faq.question}>
                <summary>
                  <span className="contact-faq-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="contact-faq-question">
                    {faq.question}
                  </span>
                  <span className="contact-faq-toggle" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING CALL TO ACTION */}
      <section className="contact-closing">
        <div className="contact-closing-inner">
          <span className="contact-section-eyebrow">
            TOGETHER, WE CAN DO MORE
          </span>
          <h2>
            Your ideas can help
            <br />
            <span>shape our future.</span>
          </h2>
          <p>
            Every question, suggestion, and partnership conversation is an
            opportunity to make the student experience better.
          </p>
          <a href="#contact-form" className="contact-closing-button">
            Start a conversation <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </div>
  )
}