"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FaMagnifyingGlass } from 'react-icons/fa6'

import { searchPlaces } from '@/tools/map-tools'
import { Place } from '@/types/map.types'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

interface SearchMapProps {
    onSearch: (result: Place) => void;
}

const Search: React.FC<SearchMapProps> = ({ onSearch }) => {
    const [search, setSearch] = useState("");
    const [listsPlaces, setListsPlaces] = useState<Place[]>([]);
    const [isInputFocused, setIsInputFocused] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const places = await searchPlaces(search)
            setListsPlaces(places);
        } catch (error) {
            console.log(error)
        }
        setLoading(false);
    }

    const handleGoToLocation = (index: number) => {
        const selectedPlace = listsPlaces[index];
        setSearch(selectedPlace.address);
        onSearch(selectedPlace)
    }

    return (
        <div className=''>
            <div className='flex items-center rounded-lg p-2 gap-1 card-tp'>
                <Input type='text' placeholder='Search for places or coordinates' className='border-none w-64 transition-all duration-500 ease-out focus:outline-none focus:ring-0 focus:border-transparent focus:shadow-none'
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch() } }}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => {
                        setTimeout(() => {
                            setIsInputFocused(false)
                        }, 500);
                    }}
                />
                <Button variant="ghost" size={'default'} disabled={loading} onClick={() => { handleSearch() }}>
                    {(!loading) ? <FaMagnifyingGlass /> : <AiOutlineLoading3Quarters className='animate-spin' />}
                </Button>
            </div>
            <div id='search-lists' className={`${(isInputFocused && listsPlaces.length != 0) ? 'block' : 'hidden'} mt-2 transition-all`}>
                <div className='flex flex-col gap-2 rounded-lg p-2 max-h-[calc(100vh-9rem)] overflow-y-auto card-tp'>
                    {
                        listsPlaces && listsPlaces.map((place, index) => (
                            <div key={index} className='p-2 hover:bg-slate-100 max-w-80 text-xs dark:hover:bg-accent' onClick={() => {
                                handleGoToLocation(index)
                            }}>
                                {place.fullName}-{place.address}
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}

export default Search