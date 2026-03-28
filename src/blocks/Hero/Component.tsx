import React from 'react'
import { Media } from '@/components/Media'
import type { HeroBlock as HeroBlockProps } from '@/payload-types'

export const HeroBlock: React.FC<HeroBlockProps> = (props) => {
    const { media } = props

    return (
        <section className="w-full overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6 py-8 lg:flex-row lg:items-center lg:justify-between ">

                    {/* Image / Logo */}
                    <div className="flex w-full justify-center lg:w-1/2 lg:justify-end">
                        <div className="w-full max-w-md lg:max-w-xl">
                            {typeof media === 'object' && media !== null && (
                                <Media
                                    resource={media}
                                    className="w-full object-contain object-center lg:scale-110"
                                />
                            )}
                        </div>
                    </div>

                    {/* Text */}
                    <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center text-center lg:mx-0 lg:w-1/2 lg:items-start lg:text-left">
                        <div className="mb-4 h-2 w-24 self-center bg-[hsl(var(--primary))] lg:self-start" />
                        <h1 className="text-4xl font-extrabold leading-[0.95] sm:text-5xl md:text-6xl">
                            <span className="text-[hsl(var(--primary))]">
                                NO<br />
                                SHORTCUTS.<br />
                                JUST
                            </span>{' '}
                            <span className="text-[hsl(var(--yellow))]">
                                RESULTS
                            </span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Decorative Divider */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="-mx-6 overflow-hidden leading-none sm:-mx-8 lg:-mx-18">
                    <svg
                        className="block h-20 w-full"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1440 320"
                        preserveAspectRatio="none"
                    >
                        <path
                            fill="hsl(var(--primary))"
                            d="M0,64L48,90.7C96,117,192,171,288,176C384,181,480,139,576,117.3C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L0,320Z"
                        />
                    </svg>
                </div>
            </div>
        </section>
    )
}