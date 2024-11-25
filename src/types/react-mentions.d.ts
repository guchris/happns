declare module "react-mentions" {
    import { ComponentType, CSSProperties } from "react";

    interface MentionStyle {
        control?: CSSProperties;
        highlighter?: CSSProperties;
        input?: CSSProperties;
        suggestions?: {
            list?: CSSProperties;
            item?: CSSProperties & { "&focused"?: CSSProperties };
        };
    }

    export interface MentionProps {
        trigger: string | RegExp;
        data: (query: string) => Promise<{ id: string; display: string }[]> | { id: string; display: string }[];
        style?: CSSProperties;
        appendSpaceOnAdd?: boolean;
    }

    export interface MentionsInputProps {
        value: string;
        onChange: (event: any, newValue: string) => void;
        style?: MentionStyle;
        placeholder?: string;
        singleLine?: boolean;
        children?: ReactNode;
    }

    export const MentionsInput: ComponentType<MentionsInputProps>;
    export const Mention: ComponentType<MentionProps>;
}