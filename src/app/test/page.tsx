import { TagInput } from '@/components/ui/tag-input'
import React from 'react'

type Props = {}

const TestPage = (props: Props) => {
    const suggestion = [
        { id: "test1", label: "Whattt" },
        { id: "test2", label: "This" },
        { id: "test3", label: "Is" },
    ]
    return (
        <div>
            <TagInput suggestions={suggestion} label='Test Tags' maxTags={20} />
        </div>
    )
}

export default TestPage