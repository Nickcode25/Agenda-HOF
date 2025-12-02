import { useState, useEffect } from 'react'
import { X, BookOpen, Calendar, DollarSign, FileText, Plus, Trash2 } from 'lucide-react'
import { useCourses, Course } from '@/store/courses'
import { Enrollment } from '@/store/enrollments'
import { formatCurrency } from '@/utils/currency'
import { getTodayInSaoPaulo } from '@/utils/timezone'
import SearchableSelect from '@/components/SearchableSelect'
import DateInput from '@/components/DateInput'

type PaymentSplit = {
  method: 'cash' | 'pix' | 'card'
  amount: number
  installments?: number
}

interface EnrollmentModalProps {
  show: boolean
  courseType?: 'enrollment' | 'course'
  enrollment?: Enrollment | null
  onClose: () => void
  onSubmit: (data: {
    courseId: string
    courseName: string
    coursePrice: number
    enrollmentDate: string
    paymentType: 'cash' | 'installment'
    paymentMethod: 'cash' | 'pix' | 'card'
    installments: number
    amountPaid: number
    notes: string
    courseType: 'enrollment' | 'course'
    paymentSplits?: PaymentSplit[]
  }) => void
}

export default function EnrollmentModal({ show, courseType = 'enrollment', enrollment, onClose, onSubmit }: EnrollmentModalProps) {
  const { courses, fetchAll, fetched } = useCourses()
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [enrollmentDate, setEnrollmentDate] = useState(getTodayInSaoPaulo())
  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'card'>('pix')
  const [installments, setInstallments] = useState(1)
  const [customValue, setCustomValue] = useState('')
  const [notes, setNotes] = useState('')

  // Estados para múltiplas formas de pagamento
  const [useMultiplePayments, setUseMultiplePayments] = useState(false)
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([
    { method: 'pix', amount: 0 }
  ])
  const [splitValues, setSplitValues] = useState<string[]>([''])

  useEffect(() => {
    if (!fetched) {
      fetchAll()
    }
  }, [fetched, fetchAll])

  useEffect(() => {
    if (show) {
      if (enrollment) {
        // Modo edição - preencher com dados existentes
        const course = courses.find(c => c.id === enrollment.course_id)
        setSelectedCourse(course || null)
        setEnrollmentDate(enrollment.enrollment_date)
        setPaymentType('cash')
        setPaymentMethod('pix')
        setInstallments(1)
        setCustomValue(enrollment.amount_paid ? formatCurrencyInput((enrollment.amount_paid * 100).toString()) : '')
        // Extrair notas sem os metadados
        const notesWithoutMeta = (enrollment.notes || '')
          .replace(/\[Inscrição Curso\]|\[Curso\]/g, '')
          .replace(/\[Pagamentos:.*?\]/g, '')
          .trim()
        setNotes(notesWithoutMeta)
        setUseMultiplePayments(false)
        setPaymentSplits([{ method: 'pix', amount: 0 }])
        setSplitValues([''])
      } else {
        // Modo criação - resetar campos
        setSelectedCourse(null)
        setEnrollmentDate(getTodayInSaoPaulo())
        setPaymentType('cash')
        setPaymentMethod('pix')
        setInstallments(1)
        setCustomValue('')
        setNotes('')
        setUseMultiplePayments(false)
        setPaymentSplits([{ method: 'pix', amount: 0 }])
        setSplitValues([''])
      }
    }
  }, [show, enrollment, courses])

  // Filtrar apenas cursos ativos ou em breve
  const availableCourses = courses.filter(c => c.status === 'active' || c.status === 'upcoming')

  const handleCourseSelect = (courseId: string) => {
    const course = courses.find(c => c.id === courseId)
    setSelectedCourse(course || null)
    // Só preenche o valor automaticamente se for matrícula em curso (não inscrição)
    if (courseType === 'course' && course?.price) {
      setCustomValue(formatCurrencyInput((course.price * 100).toString()))
    } else {
      setCustomValue('')
    }
  }

  const formatCurrencyInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    const amount = parseInt(numbers || '0', 10) / 100
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const parseCurrencyToNumber = (value: string): number => {
    const numbers = value.replace(/\D/g, '')
    return parseInt(numbers || '0', 10) / 100
  }

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(formatCurrencyInput(e.target.value))
  }

  // Funções para múltiplos pagamentos
  const addPaymentSplit = () => {
    setPaymentSplits([...paymentSplits, { method: 'pix', amount: 0 }])
    setSplitValues([...splitValues, ''])
  }

  const removePaymentSplit = (index: number) => {
    if (paymentSplits.length > 1) {
      setPaymentSplits(paymentSplits.filter((_, i) => i !== index))
      setSplitValues(splitValues.filter((_, i) => i !== index))
    }
  }

  const updatePaymentSplit = (index: number, field: keyof PaymentSplit, value: any) => {
    const updated = [...paymentSplits]
    updated[index] = { ...updated[index], [field]: value }
    setPaymentSplits(updated)
  }

  const handleSplitValueChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '')
    const amount = Number(digits) / 100
    const formatted = amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    const newSplitValues = [...splitValues]
    newSplitValues[index] = formatted
    setSplitValues(newSplitValues)

    updatePaymentSplit(index, 'amount', amount)
  }

  // Calcular totais
  const totalValue = parseCurrencyToNumber(customValue)
  const totalPaid = paymentSplits.reduce((sum, split) => sum + split.amount, 0)
  const remaining = totalValue - totalPaid

  const handleSubmit = () => {
    if (!selectedCourse) return

    const amountPaid = useMultiplePayments ? totalPaid : parseCurrencyToNumber(customValue)

    onSubmit({
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      coursePrice: selectedCourse.price || 0,
      enrollmentDate,
      paymentType,
      paymentMethod,
      installments,
      amountPaid,
      notes,
      courseType,
      paymentSplits: useMultiplePayments ? paymentSplits : undefined
    })
  }

  const isEditing = !!enrollment
  const modalTitle = isEditing
    ? (courseType === 'enrollment' ? 'Editar Inscrição' : 'Editar Matrícula')
    : (courseType === 'enrollment' ? 'Inscrição em Curso' : 'Matricular em Curso')
  const modalSubtitle = isEditing
    ? 'Edite os dados da matrícula'
    : (courseType === 'enrollment' ? 'Inscreva o aluno em um curso' : 'Selecione um curso para matricular o aluno')

  // Validação do botão de submit
  const canSubmit = selectedCourse && availableCourses.length > 0 &&
    (!useMultiplePayments || (useMultiplePayments && totalPaid > 0))

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <BookOpen size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{modalTitle}</h2>
              <p className="text-sm text-gray-500">{modalSubtitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Seleção de Curso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Curso <span className="text-red-500">*</span>
            </label>
            {availableCourses.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-amber-700 text-sm">Nenhum curso disponível para matrícula.</p>
                <p className="text-amber-600 text-xs mt-1">Crie um curso primeiro em Cursos → Novo Curso</p>
              </div>
            ) : (
              <SearchableSelect
                options={availableCourses.map(course => ({
                  value: course.id,
                  label: `${course.name}${course.price ? ` - ${formatCurrency(course.price)}` : ''}`
                }))}
                value={selectedCourse?.id || ''}
                onChange={handleCourseSelect}
                placeholder="Selecione um curso..."
              />
            )}
          </div>

          {/* Detalhes do curso selecionado */}
          {selectedCourse && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-2">{selectedCourse.name}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedCourse.price && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign size={14} className="text-orange-500" />
                    <span>Valor: {formatCurrency(selectedCourse.price)}</span>
                  </div>
                )}
                {selectedCourse.max_students && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen size={14} className="text-orange-500" />
                    <span>Máx. alunos: {selectedCourse.max_students}</span>
                  </div>
                )}
              </div>
              {selectedCourse.description && (
                <p className="text-sm text-gray-500 mt-2">{selectedCourse.description}</p>
              )}
            </div>
          )}

          {/* Data de Matrícula */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={14} className="inline mr-1" />
              Data da Matrícula
            </label>
            <DateInput
              value={enrollmentDate}
              onChange={setEnrollmentDate}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Checkbox para múltiplas formas de pagamento */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useMultiplePayments}
                onChange={(e) => setUseMultiplePayments(e.target.checked)}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Usar múltiplas formas de pagamento
              </span>
            </label>
          </div>

          {/* Pagamento Simples */}
          {!useMultiplePayments && (
            <>
              {/* Forma de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                <SearchableSelect
                  options={[
                    { value: 'cash', label: 'Valor à Vista' },
                    { value: 'installment', label: 'Parcelado' }
                  ]}
                  value={paymentType}
                  onChange={(value) => {
                    const newType = value as 'cash' | 'installment'
                    setPaymentType(newType)
                    if (newType === 'cash') {
                      setPaymentMethod('pix')
                      setInstallments(1)
                    } else {
                      setPaymentMethod('card')
                    }
                  }}
                  placeholder="Selecione a forma"
                />
              </div>

              {/* Método de Pagamento (à vista) */}
              {paymentType === 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pagamento</label>
                  <SearchableSelect
                    options={[
                      { value: 'cash', label: 'Dinheiro' },
                      { value: 'pix', label: 'PIX' }
                    ]}
                    value={paymentMethod}
                    onChange={(value) => setPaymentMethod(value as 'cash' | 'pix' | 'card')}
                    placeholder="Selecione o método"
                  />
                </div>
              )}

              {/* Parcelas (parcelado) */}
              {paymentType === 'installment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parcelas (Cartão de Crédito)</label>
                  <SearchableSelect
                    options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => ({
                      value: num.toString(),
                      label: `${num}x ${num === 1 ? '(à vista)' : ''}`
                    }))}
                    value={installments.toString()}
                    onChange={(value) => setInstallments(Number(value))}
                    placeholder="Selecione as parcelas"
                  />
                </div>
              )}
            </>
          )}

          {/* Múltiplas Formas de Pagamento */}
          {useMultiplePayments && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Formas de Pagamento</label>
                <button
                  type="button"
                  onClick={addPaymentSplit}
                  className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>

              {paymentSplits.map((split, index) => (
                <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Método</label>
                      <SearchableSelect
                        options={[
                          { value: 'cash', label: 'Dinheiro' },
                          { value: 'pix', label: 'PIX' },
                          { value: 'card', label: 'Cartão' }
                        ]}
                        value={split.method}
                        onChange={(value) => updatePaymentSplit(index, 'method', value)}
                        placeholder="Selecione"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Valor</label>
                      <input
                        type="text"
                        value={splitValues[index] || ''}
                        onChange={(e) => handleSplitValueChange(index, e.target.value)}
                        placeholder="R$ 0,00"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                    </div>
                    {split.method === 'card' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Parcelas</label>
                        <SearchableSelect
                          options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => ({
                            value: num.toString(),
                            label: `${num}x`
                          }))}
                          value={(split.installments || 1).toString()}
                          onChange={(value) => updatePaymentSplit(index, 'installments', Number(value))}
                          placeholder="1x"
                        />
                      </div>
                    )}
                  </div>
                  {paymentSplits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePaymentSplit(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-5"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              {/* Resumo do pagamento */}
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div>
                  <p className="text-sm font-medium text-gray-700">Total pago:</p>
                  <p className="text-xs text-gray-500">Valor total: {formatCurrency(totalValue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(totalPaid)}</p>
                  {totalValue > 0 && remaining !== 0 && (
                    <p className={`text-xs font-medium ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {remaining > 0 ? `Faltam ${formatCurrency(remaining)}` : `Excedeu ${formatCurrency(Math.abs(remaining))}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign size={14} className="inline mr-1" />
              {courseType === 'enrollment' ? 'Valor da Inscrição' : 'Valor Total'}
            </label>
            <input
              type="text"
              value={customValue || formatCurrency(0)}
              onChange={handleCustomValueChange}
              placeholder="R$ 0,00"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-green-600 font-bold text-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              {courseType === 'enrollment' ? 'Valor da inscrição no curso' : 'Valor da matrícula no curso'}
            </p>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={14} className="inline mr-1" />
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre a matrícula..."
              rows={3}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              canSubmit
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isEditing ? 'Salvar' : (courseType === 'enrollment' ? 'Inscrever' : 'Matricular')}
          </button>
        </div>
      </div>
    </div>
  )
}
