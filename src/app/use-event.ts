import { atom, useAtom } from "jotai"

import { Event, events } from "@/app/data"

type Config = {
    selected: Event["id"] | null
}

const configAtom = atom<Config>({
    selected: events[0].id,
})

export function useEvent() {
    return useAtom(configAtom)
}