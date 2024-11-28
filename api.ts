type VictimInVoice = {
    guild: {
        name: string;
        id: string;
        icon: string;
    };
    category: {
        name: string;
        id: string;
    };
    channel: {
        name: string;
        id: string;
        user_limit: number;
        members: any[];
        permission_to_connect: boolean;
    }
    voice_state: {
        self_mute: boolean;
        self_deaf: boolean;
        self_stream: boolean;
        self_video: boolean;
    }
}

export type DiscordTrackerVictimInfo = {
    victim_id: string;
    actual_name: string;
    actual_display_name: string;
    actual_avatar: string;
    time_in_voice: number;
    last_date_in_voice: string;
    date: string;
    in_voice: null | VictimInVoice;
    views: number;
    likes: number;
    dislikes: number;
    is_self_victim: boolean;
    is_self: boolean;
    is_remove_perm: false
}

export type DiscordTrackerVictimGuild = {
    id: string;
    icon: string;
    member_count: number;
    name: string;
    voice_member_count: number;
}

type CommentsPaginator = {
    has_other_pages: boolean;
    has_previous: boolean;
    previous_page_number: false | number;
    next_page_number: false | number;
    page_ranger: number[];
    number: number;
    has_next: boolean;
}

type Comment = {
    // id means userId
    id: null | string;
    comment_id: number;
    content: string;
    is_anonymous: boolean;
    date: string;
    name?: string;
    avatar: string;
    likes_count: number;
    replies: Comment[];
}

export type DiscordTrackerVictimComments = {
    item_count: number;
    comments_list: Comment[];
    paginator: CommentsPaginator;
}

export class DiscordTrackerAPI {

    private static request(input: string, init?: RequestInit) {
        const origin = 'https://corsproxy.io/?';

        const requestURL = `${origin}${encodeURIComponent(input)}`;

        return fetch(requestURL, init)
    }

    public static async getUserInfo(userId: string): Promise<DiscordTrackerVictimInfo | null> {
        const response = await this.request(`https://discord-tracker.com/tracker/get-victim-info/${userId}/`)

        if (!response.ok) {
            return null;
        }

        return response.json()
    }

    public static async getUserGuilds(userId: string): Promise<DiscordTrackerVictimGuild[] | null> {
        const response = await this.request(`https://discord-tracker.com/tracker/get-mutual-guilds/${userId}/`)

        if (!response.ok) {
            return null;
        }

        return response.json().then(r => r.guild_list)
    }

    public static async getUserComments(userId: string, page?: number): Promise<DiscordTrackerVictimComments | null> {
        let requestUrl = `https://discord-tracker.com/tracker/get-comments/${userId}/`;

        if (page !== undefined) {
            requestUrl += `?page=${page}`
        }

        const response = await this.request(requestUrl)

        if (!response.ok) {
            return null;
        }

        return response.json()
    }
}
