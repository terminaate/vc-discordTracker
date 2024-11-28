import {NavContextMenuPatchCallback} from "@api/ContextMenu";
import ErrorBoundary from "@components/ErrorBoundary";
import {ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal} from "@utils/modal";
import definePlugin from "@utils/types";
import {Button, Menu, Text, useEffect, useMemo, useState, React, Avatar, IconUtils, UserUtils} from "@webpack/common";
import type {Channel, User} from "discord-types/general";
import './style.css';
import {cl} from "./utils";
import {
    DiscordTrackerAPI,
    DiscordTrackerVictimComments,
    DiscordTrackerVictimGuild,
    DiscordTrackerVictimInfo
} from "./api";
import {findByPropsLazy} from "@webpack";

interface UserContextProps {
    channel: Channel;
    guildId?: string;
    user: User;
}

type ModalPageProps = {
    user: User;
}

const ChannelActions: {
    disconnect: () => void;
    selectVoiceChannel: (channelId: string) => void;
} = findByPropsLazy("disconnect", "selectVoiceChannel");

const UserPageComments = (props: ModalPageProps) => {
    const {user} = props;

    const [comments, setComments] = useState<DiscordTrackerVictimComments['comments_list']>([]);
    const [data, setData] = useState<DiscordTrackerVictimComments | null | undefined>();

    const fetchData = async (page?: number) => {
        const response = await DiscordTrackerAPI.getUserComments(user.id, page);

        setData(response);
        setComments(prev => [...prev, ...(response?.comments_list ?? [])]);
    }

    useEffect(() => {
        fetchData()
    }, []);

    if (data === null) {
        return (
            <div>couldn't fetch comments</div>
        )
    }

    if (data === undefined) {
        return (
            <div>loading...</div>
        )
    }

    return (
        <div className={cl('user-page-comments')}>
            {comments.map((comment) => (
                <div className={cl('user-page-comment')} key={comment.comment_id}>
                    <Avatar size={'SIZE_32'}
                            src={comment.is_anonymous ? IconUtils.getDefaultAvatarURL(user.id) : IconUtils.getUserAvatarURL({
                                id: comment.id,
                                avatar: comment.avatar
                            } as User)}/>
                    <div className={cl('user-page-comment-content')}>
                        <a onClick={async () => openTrackerModal(await UserUtils.getUser(comment.id))}>{comment.name ?? 'Anon'}</a>
                        <span>{comment.content}</span>
                    </div>
                </div>
            ))}
            {data.paginator.has_next && (
                <Button onClick={() => fetchData(data?.paginator.next_page_number || 0)}>load more</Button>
            )}
        </div>
    )
}

const UserPage = (props: ModalPageProps) => {
    const {user} = props;

    const [data, setData] = useState<undefined | null | DiscordTrackerVictimInfo>();

    useEffect(() => {
        DiscordTrackerAPI.getUserInfo(user.id).then(setData)
    }, []);

    if (data === null) {
        return (
            <div>
                <Text>user not found</Text>
            </div>
        )
    }

    if (data === undefined) {
        return (
            <div>
                <Text>loading...</Text>
            </div>
        )
    }

    const connectToVoiceChannel = () => {
        ChannelActions.selectVoiceChannel(data!.in_voice!.channel.id)
    }

    return (
        <div className={cl('user-page')}>
            <div className={cl('user-page-header')}>
                <Avatar size={'SIZE_120'} src={user.getAvatarURL()}/>
                <div className={cl('user-page-info')}>
                    <span>Time in voice: {String(Math.floor(data.time_in_voice / 60 / 60) || 0)}h</span>
                    <span>Last time in voice: {String(data.last_date_in_voice)}</span>
                    <span>Views: {String(data.views)}</span>
                    <span>Likes: {String(data.likes)}</span>
                    <span>Dislikes: {String(data.dislikes)}</span>
                </div>
                {data.in_voice && (
                    <div className={cl('user-page-voice')}>
                        <div className={cl('user-page-voice-guild')}>
                            <Avatar src={IconUtils.getGuildIconURL({
                                id: data.in_voice.guild.id,
                                icon: data.in_voice.guild.icon
                            })} size={'SIZE_24'}/>
                            <span>{data.in_voice.guild.name}</span>
                        </div>
                        <Button onClick={connectToVoiceChannel}>{data.in_voice.channel.name}</Button>
                    </div>
                )}
            </div>
            <UserPageComments {...props} />
        </div>
    )
}

const GuildsPage = ({user}: ModalPageProps) => {
    const [data, setData] = useState<undefined | null | DiscordTrackerVictimGuild[]>();

    useEffect(() => {
        DiscordTrackerAPI.getUserGuilds(user.id).then(setData)
    }, []);

    if (data === null) {
        return (
            <div>
                <Text>not found</Text>
            </div>
        )
    }

    if (data === undefined) {
        return (
            <div>
                <Text>loading...</Text>
            </div>
        )
    }

    return (
        <div className={cl('guilds-page')}>
            {data.map(guild => (
                <div className={cl('guild')}>
                    <div className={cl('guild-avatar')}>
                        <Avatar src={IconUtils.getGuildIconURL({id: guild.id, icon: guild.icon})} size={'SIZE_48'}/>
                    </div>
                    <div className={cl('guild-info')}>
                        <span className={cl('guild-name')}>{guild.name}</span>
                        <span
                            className={cl('guild-members-count')}>Members count: {guild.member_count} ; Voice online: {guild.voice_member_count}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

const Pages = {
    UserPage,
    GuildsPage,
}

const Modal = ({modalProps, modalKey, user}: { modalProps: any; modalKey: string, user: User; }) => {
    const [currentPage, setCurrentPage] = useState<keyof typeof Pages>('UserPage')

    const Page = useMemo(() => Pages[currentPage], [currentPage]);

    return (
        <ErrorBoundary>
            <ModalRoot {...modalProps} size={ModalSize.DYNAMIC}>
                <ModalHeader>
                    <Text variant="heading-lg/semibold">
                        {user.username}
                    </Text>
                </ModalHeader>

                <ModalContent>
                    <div className={cl('modal-content')}>
                        <div className={cl('modal-navbar')}>
                            <Button onClick={() => setCurrentPage('UserPage')}>Profile</Button>
                            <Button onClick={() => setCurrentPage('GuildsPage')}>Servers</Button>
                            <Button onClick={() => setCurrentPage('GuildsPage')}>Search by role</Button>
                        </div>
                        <div className={cl('modal-page')}>
                            <Page user={user}/>
                        </div>
                    </div>
                </ModalContent>

                <ModalFooter>
                    <div>
                    </div>
                </ModalFooter>
            </ModalRoot>
        </ErrorBoundary>
    );
}

const openTrackerModal = (user: User) => {
    const modalKey = `vc-discord-tracker-${user.id}`;

    openModal((props) => (
        <Modal
            modalKey={modalKey}
            modalProps={props}
            user={user}
        />
    ), {modalKey: `vc-discord-tracker-${user.id}`});
};

const UserContext: NavContextMenuPatchCallback = (children, {user}: UserContextProps) => {
    const label = 'Discord tracker';

    children.splice(-1, 0, (
        <Menu.MenuGroup>
            <Menu.MenuItem
                id="discord-tracker"
                label={label}
                action={() => openTrackerModal(user)}
            />
        </Menu.MenuGroup>
    ));
};

export default definePlugin({
    name: "Disocrd-Tracker",
    authors: [],
    description: "Stalk pussies",
    patches: [],

    contextMenus: {
        'user-context': UserContext
    }
});
