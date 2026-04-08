'use client'

import React, { useState } from 'react'
import { ChevronRightCircle, ChevronLeftCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

type GameEvent = {
    date: string
    time: string
    homeTeam: string
    awayTeam: string
    competition: string
    gender: 'male' | 'female'
}

type Props = {
    maleEvent: GameEvent | null
    femaleEvent: GameEvent | null
}

export function NextMatchCard({
    maleEvent,
    femaleEvent,
}: Props) {
    const tabs: ('male' | 'female')[] = ['male', 'female']
    const [currentTabIndex, setCurrentTabIndex] = useState(0)
    const t = useTranslations('NextMatchBlock')

    const goNext = (e: React.MouseEvent<HTMLButtonElement>) => {
        setCurrentTabIndex((prev) => (prev + 1) % tabs.length)
        e.currentTarget.blur()
    }

    const goPrev = (e: React.MouseEvent<HTMLButtonElement>) => {
        setCurrentTabIndex((prev) => (prev - 1 + tabs.length) % tabs.length)
        e.currentTarget.blur()
    }

    const activeTab = tabs[currentTabIndex]
    const event = activeTab === 'male' ? maleEvent : femaleEvent

    // Common header with buttons
    const Header = (
        <div
            className="relative flex font-semibold text-sm overflow-hidden"
            style={{
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
            }}
        >
            <div className="flex items-center justify-between flex-1 px-4 py-3">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        className="p-1 rounded hover:bg-white/10"
                        aria-label={t('previous')}
                        onClick={goPrev}
                    >
                        <ChevronLeftCircle size={22} />
                    </button>

                    <button
                        type="button"
                        className="p-1 rounded hover:bg-white/10"
                        aria-label={t('next')}
                        onClick={goNext}
                    >
                        <ChevronRightCircle size={22} />
                    </button>
                </div>

                <div className="whitespace-nowrap text-right">
                    {activeTab === 'male' ? t('maleTeam') : t('femaleTeam')}
                </div>
            </div>

            <div
                className="w-16 -skew-x-12 translate-x-3"
                style={{ backgroundColor: 'hsl(var(--yellow))' }}
            />
        </div>
    )

    return (
        <div className="flex flex-col items-center gap-6">

            {/* Reusable title */}
            <h2 className="text-2xl font-bold text-center text-[hsl(var(--primary))]">{t('title')}</h2>

            <div
                className="w-full max-w-sm shadow-md rounded-lg overflow-hidden border"
                style={{ borderColor: 'hsl(var(--border))' }}
            >
                {Header}

                {/* Match Content */}
                {event ? (
                    <div
                        className="px-4 py-4 min-h-[160px] flex flex-col justify-between"
                        style={{ backgroundColor: 'hsl(var(--secondary))' }}
                    >
                        <div>
                            <div className="text-xs font-semibold mb-2 text-center">
                                {event.competition}
                            </div>

                            <div className="grid grid-cols-3 items-stretch text-center mb-4">
                                <div
                                    className="text-sm font-medium py-2 rounded flex items-center justify-center h-12"
                                    style={{
                                        backgroundColor:
                                            event.homeTeam === 'CAB Madeira'
                                                ? 'hsl(var(--yellow))'
                                                : 'hsl(var(--primary))',
                                        color: 'hsl(var(--primary-foreground))',
                                    }}
                                >
                                    {event.homeTeam}
                                </div>

                                <div className="text-xs font-semibold flex items-center justify-center h-12">
                                    VS
                                </div>

                                <div
                                    className="text-sm font-medium py-2 rounded flex items-center justify-center h-12"
                                    style={{
                                        backgroundColor:
                                            event.awayTeam === 'CAB Madeira'
                                                ? 'hsl(var(--yellow))'
                                                : 'hsl(var(--primary))',
                                        color: 'hsl(var(--primary-foreground))',
                                    }}
                                >
                                    {event.awayTeam}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between text-sm font-medium border-t dark:border-[hsl(var(--primary))] pt-3">
                            <span>
                                {new Date(`${event.date}T${event.time}`).toLocaleDateString(
                                    'pt-PT',
                                    {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long',
                                    }
                                )}
                            </span>
                            <span>{event.time}</span>
                        </div>
                    </div>
                ) : (
                    <div
                        className="px-4 py-6 min-h-[160px] flex items-center justify-center text-sm text-center"
                        style={{ backgroundColor: 'hsl(var(--secondary))' }}
                    >
                        {t('noUpcoming')}
                    </div>
                )}
            </div>
        </div>
    )
}
