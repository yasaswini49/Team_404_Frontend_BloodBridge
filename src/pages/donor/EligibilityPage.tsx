import { useState } from 'react'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiCall } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ELIGIBILITY_QUESTIONS, FAIL_REASON_LABELS, type EligibilityResult } from '@/types'
import { cn } from '@/lib/utils'

type Answers = Record<string, boolean>

const defaultAnswers = (): Answers =>
  Object.fromEntries(ELIGIBILITY_QUESTIONS.map((q) => [q.key, false]))

export function EligibilityPage() {
  const { token } = useAuth()
  const { addToast } = useToast()
  const [answers, setAnswers] = useState<Answers>(defaultAnswers())
  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await apiCall<EligibilityResult>('/donors/eligibility-screening', 'POST', answers, token)
      setResult(res)
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Screening failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setAnswers(defaultAnswers())
    setResult(null)
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card glow>
          <CardHeader>
            <CardTitle>Eligibility Screening</CardTitle>
            <p className="text-sm text-ice-muted">11-question self-assessment per national donor guidelines</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {ELIGIBILITY_QUESTIONS.map((q, i) => (
              <motion.div
                key={q.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between gap-4 py-3 border-b border-border-dim last:border-0"
              >
                <span className="text-sm text-ice flex-1">{q.label}</span>
                <div className="flex gap-1 shrink-0">
                  {[true, false].map((val) => (
                    <Button
                      key={String(val)}
                      type="button"
                      size="sm"
                      variant={answers[q.key] === val ? 'primary' : 'secondary'}
                      onClick={() => setAnswers({ ...answers, [q.key]: val })}
                    >
                      {val ? 'Yes' : 'No'}
                    </Button>
                  ))}
                </div>
              </motion.div>
            ))}
            <Button size="lg" className="w-full" onClick={submit} disabled={loading || result !== null}>
              Submit Screening
            </Button>
          </CardContent>
        </Card>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className={cn('p-6', result.passed ? 'border-emerald-500/30' : 'border-blood-400/30')}>
                <div className="flex items-center gap-3 mb-4">
                  {result.passed ? (
                    <><CheckCircle className="text-emerald-400" size={28} /><h3 className="font-display text-2xl text-emerald-300">You are Eligible!</h3></>
                  ) : (
                    <><XCircle className="text-blood-400" size={28} /><h3 className="font-display text-2xl text-blood-300">Not Eligible</h3></>
                  )}
                </div>
                {!result.passed && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {result.fail_reasons.map((r) => (
                      <Badge key={r} variant="blood">{FAIL_REASON_LABELS[r] ?? r}</Badge>
                    ))}
                  </div>
                )}
                <Button variant="secondary" onClick={reset}><RotateCcw size={14} /> Retake Screening</Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
