'use client'
import React, { useState } from 'react'
import { ChevronRightCircle, ChevronLeftCircle } from 'lucide-react'
import { TeamStanding } from './Component'


interface TeamStandingsProps {
    maleData: TeamStanding[]
    femaleData: TeamStanding[]
}

export const TeamStandings: React.FC<TeamStandingsProps> = ({ maleData, femaleData }) => {
    const tabs: ('male' | 'female')[] = ['male', 'female'];
    const [currentTabIndex, setCurrentTabIndex] = useState(0);

    const goNext = (e: React.MouseEvent<HTMLButtonElement>) => {
        setCurrentTabIndex((prev) => (prev + 1) % tabs.length);
        (e.currentTarget as HTMLButtonElement).blur();
    };

    const goPrev = (e: React.MouseEvent<HTMLButtonElement>) => {
        setCurrentTabIndex((prev) => (prev - 1 + tabs.length) % tabs.length);
        (e.currentTarget as HTMLButtonElement).blur();
    };

    return (
        <div className="flex flex-col items-center gap-6">

            {/* Reusable title */}
            <h2 className="text-2xl font-bold text-center text-[hsl(var(--primary))]">Rankings</h2>


            <div className="w-full max-w-sm shadow-md rounded-lg overflow-hidden border" style={{ borderColor: 'hsl(var(--border))' }}>
                {/* Header */}
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
                                className="p-1 rounded hover:bg-white/10 dark:hover:bg-blue-100 "
                                aria-label="Previous"
                                onClick={goPrev}
                            >
                                <ChevronLeftCircle size={22} />
                            </button>

                            <button
                                type="button"
                                className="p-1 rounded hover:bg-white/10 dark:hover:bg-blue-100 "
                                aria-label="Next"
                                onClick={goNext}
                            >
                                <ChevronRightCircle size={22} />
                            </button>
                        </div>
                        <div className="whitespace-nowrap text-right">
                            {tabs[currentTabIndex] === 'male' ? 'Male Team' : 'Female Team'}
                        </div>

                    </div>

                    <div
                        className="w-16 -skew-x-12 translate-x-3 z-60"
                        style={{ backgroundColor: 'hsl(var(--yellow))' }}
                    />
                </div>

                {/* Table header */}
                <div
                    className="grid grid-cols-12 px-4 py-3 text-xs font-semibold"
                    style={{
                        backgroundColor: 'hsl(var(--secondary))',
                        color: 'hsl(var(--secondary-foreground))',
                    }}
                >
                    <div className="col-span-1"></div>
                    <div className="col-span-1"></div>
                    <div className="col-span-6">Team</div>
                    <div className="col-span-1 text-center">M</div>
                    <div className="col-span-1 text-center">W</div>
                    <div className="col-span-1 text-center">L</div>
                    <div className="col-span-1 text-center">PTS</div>
                </div>

                {/* Rows */}
                <div className="h-96 overflow-y-auto">
                    {(tabs[currentTabIndex] === 'male' ? maleData : femaleData).map((team, index) => {
                        const isCabMadeira = team.teamName === 'CAB Madeira';

                        return (
                            <div
                                key={team.rank}
                                className="grid grid-cols-12 items-center px-4 py-3"
                                style={{
                                    backgroundColor: isCabMadeira
                                        ? 'hsl(var(--yellow))'
                                        : index % 2 === 0
                                            ? 'hsl(var(--primary))'
                                            : 'hsl(var(--secondary))',
                                    color: isCabMadeira
                                        ? 'hsl(var(--primary-foreground))'
                                        : index % 2 === 0
                                            ? 'hsl(var(--primary-foreground))'
                                            : 'hsl(var(--secondary-foreground))',
                                }}
                            >
                                <div className="col-span-1 text-center text-sm">{team.rank}</div>
                                <div className="col-span-1">
                                    {team.logoUrl && (
                                        <img
                                            src={team.logoUrl}
                                            alt={team.teamName}
                                            className="h-6 w-6 object-contain rounded"
                                        />
                                    )}
                                </div>
                                <div className="col-span-6 text-sm font-medium">
                                    {team.teamName}
                                </div>
                                <div className="col-span-1 text-center text-sm">{team.matches}</div>
                                <div className="col-span-1 text-center text-sm">{team.wins}</div>
                                <div className="col-span-1 text-center text-sm">{team.losses}</div>
                                <div className="col-span-1 text-center text-sm font-semibold">{team.points}</div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    )
}
