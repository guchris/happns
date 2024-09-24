import { atom, useAtom } from "jotai"

import { Event } from "@/components/types"

type Config = {
    selected: Event["id"] | null
}

const configAtom = atom<Config>({
    selected: null
})

export function useEvent() {
    return useAtom(configAtom)
}