"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Loader2, Phone, User, Briefcase, ShoppingBag, Hash } from "lucide-react"

interface LeadRegistrationFormProps {
    onSuccess?: () => void
    initialData?: {
        leadId?: string
        firstName?: string
        lastName?: string
        phone?: string
        company?: string
        interest?: string
        email?: string
        cnpj?: string
    }
}




// --- CONSTANTS & MAPPINGS from Salesforce Rules ---

interface LeadSourceMap {
    [key: string]: string[]
}

const BUSINESS_UNITS = [
    'Usinagem',
    'Injeção',
    'Corte e Conformação',
    'Automação'
]

const SEGMENTS = [
    'Usinagem',
    'Usinagem Matrizaria e Ferramentaria',
    'Usinagem Produção',
    'Usinagem Estamparia de Metais',
    'Injeção de Plástico Sopro ou Extrusão',
    'Injeção de Plástico',
    'Injeção de Alumínio',
    'Corte e Conformação',
    'Automação',
    'Packing'
]

const INTERESTS = [
    'Centro de Usinagem Vertical',
    'Centro de Usinagem Horizontal',
    'Centro de Usinagem Portal',
    'Torno CNC',
    'Dobradeira',
    'Maquina Laser',
    'Guilhotina',
    'Eletro Erosão',
    'Mandriladora',
    'Injetora de Plasticos',
    'Injetora de Aluminio',
    'Sopradora',
    'Extrusora'
]

const LEAD_SOURCES: LeadSourceMap = {
    "Ações de Marketing": [
        "Ações de Marketing (Anuncios)",
        "Ações de Marketing (Chico Raiz Usada na entrada)",
        "Ações de Marketing (DIA D)",
        "Ações de Marketing (E-mail marketing)",
        "Ações de Marketing (Internet/Site)",
        "Ações de Marketing (Workshop)",
        "Ações de Marketing (Feira)"
    ],
    "Feira": [
        "Feira INTERPLAST 2024",
        "Mercopar 2024",
        "FIMEC 2025",
        "Feira Expomafe 2025",
        "Fispal 2025",
        "Intermach 2025",
        "Campanha Beeviral",
        "LP Okamura"
    ],
    "Indicação": [
        "Indicação da Diretoria",
        "Indicação de clientes",
        "Indicação de representantes"
    ],
    "Vendas Internas": [
        "Ações de Marketing (Anuncios)",
        "Ações de Marketing (DIA D)",
        "Ações de Marketing (E-mail marketing)",
        "Ações de Marketing (Internet/Site)",
        "Ações de Marketing (Workshop)",
        "Ações de Marketing (Feira)",
        "Indicação de clientes",
        "Indicação da Diretoria",
        "Indicação de representantes"
    ],
    "Service": [
        "Indicação de clientes",
        "Indicação de representantes"
    ],
    "Representantes": [
        "Ações de Marketing (Anuncios)",
        "Ações de Marketing (DIA D)",
        "Ações de Marketing (E-mail marketing)",
        "Ações de Marketing (Internet/Site)",
        "Ações de Marketing (Workshop)",
        "Ações de Marketing (Feira)",
        "Indicação de clientes",
        "Indicação de representantes",
        "Visita"
    ],
    "Qualificação SCOOTO": [
        "Ações de Marketing (Anuncios)",
        "Ações de Marketing (DIA D)",
        "Ações de Marketing (E-mail marketing)",
        "Ações de Marketing (Internet/Site)",
        "Ações de Marketing (Workshop)",
        "Ações de Marketing (Feira)",
        "Indicação de clientes",
        "Indicação de representantes",
        "Visita"
    ]
}

export function LeadRegistrationForm({ onSuccess, initialData }: LeadRegistrationFormProps) {
    const { data: session } = useSession()

    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
    const [errorMessage, setErrorMessage] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    const [formData, setFormData] = useState({
        firstName: initialData?.firstName || "",
        lastName: initialData?.lastName || "",
        phone: initialData?.phone || "",
        email: initialData?.email || "",
        company: initialData?.company || "",
        cnpj: initialData?.cnpj || "",
        interest: initialData?.interest || "",

        businessUnit: "",
        segment: "",
        leadSource: "Ações de Marketing",
        subOrigin: "Ações de Marketing (Anuncios)"
    })



    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => {
            const updates: any = { [name]: value }
            // Reset subOrigin if leadSource changes
            if (name === "leadSource") {
                updates.subOrigin = ""
            }
            return { ...prev, ...updates }
        })
    }

    const formatPhone = (phone: string) => {
        // Remove everything that is not a digit
        const temp = phone.replace(/\D/g, "")
        // If it starts with 55, keep it. If not, add it.
        if (temp.startsWith("55") && temp.length > 11) {
            return temp
        }
        return `55${temp}`
    }

    const cleanNumber = (val: string) => val.replace(/\D/g, "")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setStatus("idle")
        setErrorMessage("")

        try {
            // --- VALIDATION RULES (Conforme Planilha) ---

            // 1. Campos Obrigatórios
            const requiredFields = [
                { key: 'lastName', label: 'Sobrenome' },
                { key: 'company', label: 'Empresa' },
                { key: 'cnpj', label: 'CNPJ' },
                { key: 'leadSource', label: 'Origem do Lead' },
                { key: 'businessUnit', label: 'Unidade de Negócio' }
            ]

            const missing = requiredFields.filter(f => !formData[f.key as keyof typeof formData])
            if (missing.length > 0) {
                throw new Error(`Campos obrigatórios faltando: ${missing.map(m => m.label).join(", ")}`)
            }

            // 2. Formato do Celular (55 + DDD + 9xxxxx)
            // Vamos apenas garantir que tenha números suficientes. 
            // O ideal é 55 (2) + DDD (2) + 9 + 8 digitos = 13 digitos
            const finalPhone = formatPhone(formData.phone)
            if (finalPhone.length < 12) {
                throw new Error("Telefone inválido. Informe DDD + Número (ex: 11999999999)")
            }

            // 3. CNPJ (Somente Números)
            const finalCnpj = cleanNumber(formData.cnpj)
            if (finalCnpj.length !== 14) {
                // Validação básica de tamanho, pode ser melhorada
                throw new Error("CNPJ deve conter 14 dígitos.")
            }

            // --- PAYLOAD PREPARATION ---
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: finalPhone, // Normalized 55...
                company: formData.company,
                cnpj: finalCnpj,
                interest: formData.interest,
                businessUnit: formData.businessUnit,
                segment: formData.segment,
                leadSource: formData.leadSource,
                subOrigin: formData.subOrigin, // Dependent field
                email: session?.user?.email || "unknown"
            }

            // Call Supabase Edge Function to pass data to Salesforce (TEST MODE)
            const { data, error } = await supabase.functions.invoke('register-mql-test', {
                body: payload
            })



            if (error) {
                throw new Error(error.message || "Erro ao conectar com o serviço de cadastro.")
            }

            if (data && !data.success) {
                throw new Error(data.error || "Ocorreu um erro ao cadastrar o lead no Salesforce.")
            }

            // Success
            setStatus("success")
            setSuccessMessage(`Lead cadastrado com sucesso! ID Salesforce: ${data.id}`)

            // If we have a leadId from our internal DB, update its status
            if (initialData?.leadId) {
                await supabase
                    .from('info_lead')
                    .update({
                        is_mql: true,
                        salesforce_id: data.id,
                        mql_at: new Date().toISOString()
                    })
                    .eq('id', initialData.leadId)
            }


            setFormData({
                firstName: "",
                lastName: "",
                phone: "",
                email: "",
                company: "",
                cnpj: "",
                interest: "",
                businessUnit: "",
                segment: "",
                leadSource: "Ações de Marketing",
                subOrigin: "Ações de Marketing (Anuncios)"
            })


            if (onSuccess) {
                setTimeout(() => {
                    onSuccess()
                }, 2000)
            }


        } catch (error: any) {
            console.error("Erro no cadastro:", error)
            setStatus("error")
            setErrorMessage(error.message || "Erro desconhecido ao tentar cadastrar.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full space-y-4">
            {initialData?.phone && (
                <div className="flex items-center gap-2 pb-2">
                    <Badge variant="secondary" className="bg-muted text-muted-foreground border-muted-foreground/20 font-mono py-1 px-3 gap-2">
                        <Phone className="h-3 w-3" />
                        ID: {initialData.phone}
                    </Badge>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">




                {/* Nome e Sobrenome */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">Primeiro Nome</Label>
                        <Input
                            id="firstName"
                            name="firstName"
                            placeholder="Ex: João"
                            value={formData.firstName}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Sobrenome <span className="text-red-500">*</span></Label>
                        <Input
                            id="lastName"
                            name="lastName"
                            placeholder="Ex: Silva"
                            value={formData.lastName}
                            onChange={handleInputChange}

                        />
                    </div>
                </div>

                {/* Celular / WhatsApp - Only show if phone is NOT provided */}
                {!initialData?.phone && (
                    <div className="space-y-2">
                        <Label htmlFor="phone">Celular / WhatsApp <span className="text-destructive">*</span></Label>
                        <Input
                            id="phone"
                            name="phone"
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={handleInputChange}
                        />
                        <p className="text-[11px] text-muted-foreground">O sistema formatará automaticamente para 55 + DDD + Número.</p>
                    </div>
                )}


                {/* Empresa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="company">Empresa <span className="text-red-500">*</span></Label>
                        <Input
                            id="company"
                            name="company"
                            placeholder="Razão Social ou Nome Fantasia"
                            value={formData.company}
                            onChange={handleInputChange}

                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ <span className="text-red-500">*</span></Label>
                        <Input
                            id="cnpj"
                            name="cnpj"
                            placeholder="Apenas números"
                            value={formData.cnpj}
                            onChange={handleInputChange}
                            maxLength={18}

                        />
                    </div>
                </div>

                {/* Origem e Suborigem */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                    <div className="space-y-2">
                        <Label htmlFor="leadSource">Origem do Lead <span className="text-red-500">*</span></Label>
                        <Select
                            value={formData.leadSource}
                            onValueChange={(val) => handleSelectChange("leadSource", val)}
                            disabled={true}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a origem" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(LEAD_SOURCES).map(src => (
                                    <SelectItem key={src} value={src}>{src}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subOrigin">Suborigem</Label>
                        <Select
                            value={formData.subOrigin}
                            onValueChange={(val) => handleSelectChange("subOrigin", val)}
                            disabled={true}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={formData.leadSource ? "Selecione a suborigem" : "Selecione a origem primeiro"} />
                            </SelectTrigger>
                            <SelectContent>
                                {formData.leadSource && LEAD_SOURCES[formData.leadSource]?.map(sub => (
                                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Detalhes do Negócio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="businessUnit">Unidade de Negócio <span className="text-red-500">*</span></Label>
                        <Select
                            value={formData.businessUnit}
                            onValueChange={(val) => handleSelectChange("businessUnit", val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                {BUSINESS_UNITS.map(unit => (
                                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="segment">Segmento</Label>
                        <Select
                            value={formData.segment}
                            onValueChange={(val) => handleSelectChange("segment", val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                {SEGMENTS.map(seg => (
                                    <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="interest">Produto de Interesse</Label>
                    <Select
                        value={formData.interest}
                        onValueChange={(val) => handleSelectChange("interest", val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o produto principal" />
                        </SelectTrigger>
                        <SelectContent>
                            {INTERESTS.map(int => (
                                <SelectItem key={int} value={int}>{int}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Status Messages */}
                {status === "error" && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errorMessage}
                    </div>
                )}

                {status === "success" && (
                    <div className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 p-3 rounded-md flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        {successMessage}
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            "Cadastrar Lead"
                        )}
                    </Button>
                </div>
            </form>
            <div className="mt-4 text-center text-xs text-muted-foreground">
                <p>Usuário responsável: {session?.user?.name || session?.user?.email || "Não identificado"}</p>
            </div>
        </div>
    )
}
