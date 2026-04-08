'use client'

import React from 'react'
import { Globe } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

import { isLocale, normalizeLocale, routing } from '@/i18n/routing'
import localization from '@/i18n/localization'
import { useRouter, usePathname } from 'next/navigation'

export const LanguageSelector: React.FC = () => {
    const router = useRouter()
    const pathname = usePathname()

    const segments = pathname.split('/').filter(Boolean)
    const currentLocale = normalizeLocale(segments[0])

    const handleLanguageChange = (locale: string) => {
        const newSegments = [...segments]

        if (isLocale(newSegments[0])) {
            newSegments[0] = locale
        } else {
            newSegments.unshift(locale)
        }

        router.push(`/${newSegments.join('/')}`)
    }

    return (
        <div className="flex justify-center">
            <Select value={currentLocale} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[180px] h-10 border bg-background hover:bg-blue-100 dark:hover:bg-blue-900/30 outline outline-0 hover:outline-2 outline-black dark:outline-white transition-colors">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <SelectValue />
                    </div>
                </SelectTrigger>

                <SelectContent>
                    {routing.locales.map((locale) => (
                        <SelectItem key={locale} value={locale}>
                            {localization.locales.find((l) => l.code === locale)?.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}