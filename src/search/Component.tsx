'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState, useEffect } from 'react'
import { useDebounce } from '@/utilities/useDebounce'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'

export const Search: React.FC = () => {
  const [value, setValue] = useState('')
  const router = useRouter()
  const t = useTranslations('Search')

  const debouncedValue = useDebounce(value)

  useEffect(() => {
    router.push(`/search${debouncedValue ? `?q=${debouncedValue}` : ''}`)
  }, [debouncedValue, router])

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <Label htmlFor="search" className="sr-only">
          {t('label')}
        </Label>
        <Input
          id="search"
          onChange={(event) => {
            setValue(event.target.value)
          }}
          placeholder={t('placeholder')}
        />
        <button type="submit" className="sr-only">
          {t('submit')}
        </button>
      </form>
    </div>
  )
}
