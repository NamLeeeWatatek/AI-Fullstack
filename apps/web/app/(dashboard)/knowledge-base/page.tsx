'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function KnowledgeBasePage() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/knowledge-base/collections')
    }, [router])

    return (
        <></>
    )
}
