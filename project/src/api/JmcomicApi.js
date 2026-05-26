import { setting } from "../components/general/Setting.js";
import { crypto } from "./Crypto.js";

class JmcomicApi {
    accessToken;
    currentKey;
    servers;
    imgServers = [
        "cdn-msp.jmapiproxy1.cc",
        "cdn-msp.jmapiproxy2.cc",
        "cdn-msp2.jmapiproxy2.cc",
        "cdn-msp3.jmapiproxy2.cc",
        "cdn-msp.jmapinodeudzn.net",
        "cdn-msp3.jmapinodeudzn.net",
    ];
    usingImgServerIndex = 0;
    constructor() {
        this.init();
    }
    async init() {
        this.currentKey = this.#getCurrentKey();
        this.accessToken = this.#getAccessToken(this.currentKey);
        this.servers = await this.#getCurrentApi();
    }
    #getCurrentKey() {
        return Math.floor(Date.now() / 1000);
    }
    #getAccessToken(key) {
        return {
            token: crypto.calculateMD5(key + "185Hcomic3PAPP7R"),
            tokenParam: `${key},3.2.0`,
        };
    }
    async #getCurrentApi() {
        const resp = await this.retryFetch(
            "https://rup4a04-c01.tos-ap-southeast-1.bytepluses.com/newsvr-2025.txt",
            1,
        );
        const text = await resp.text();
        return crypto.decryptCurrentApi(text).Server;
    }
    async retryFetch(getUrl, init, count) {
        if (typeof getUrl === "string") {
            let url = getUrl;
            getUrl = () => url;
        }
        if (typeof init === "number") {
            count = init;
            init = {};
        }
        try {
            const resp = await fetch(getUrl(count - 1), init);
            return resp;
        } catch (error) {
            if (count <= 0) throw new Error(error);
            return this.retryFetch(getUrl, init, count - 1);
        }
    }
    async getSearchResults(searchQuery, page,mode) {
        const searchResponse = await this.retryFetch(
            (i) =>
                `https://${this.servers[4 - i]}/search?search_query=${searchQuery}&o=${mode}&page=${page}`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const searchData = await searchResponse.json();
        return crypto.decryptData(this.currentKey, searchData.data);
    }
    async getLatestContent(page) {
        const latestResponse = await this.retryFetch(
            (i) => `https://${this.servers[4 - i]}/latest?page=${page}`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const latestData = await latestResponse.json();
        return crypto.decryptData(this.currentKey, latestData.data);
    }
    async getPromotionContent() {
        let cache = localStorage.getItem("promoteCache");
        if (cache) {
            cache = JSON.parse(cache);
            if (cache.date === new Date().toDateString()) {
                return cache.data;
            }
        }
        const promotionResponse = await this.retryFetch(
            (i) => `https://${this.servers[4 - i]}/promote?page=1`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const promotionData = await promotionResponse.json();
        const data = crypto.decryptData(this.currentKey, promotionData.data);
        localStorage.setItem(
            "promoteCache",
            JSON.stringify({
                date: new Date().toDateString(),
                data,
            }),
        );
        console.log(data);

        return data;
    }
    async getComicAlbum(comicId) {
        const albumResponse = await this.retryFetch(
            (i) => `https://${this.servers[4 - i]}/album?id=${comicId}`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const albumData = await albumResponse.json();
        return crypto.decryptData(this.currentKey, albumData.data);
    }
    async getComicChapter(comicId) {
        const chapterResponse = await this.retryFetch(
            (i) => `https://${this.servers[4 - i]}/chapter?id=${comicId}`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const chapterData = await chapterResponse.json();
        return crypto.decryptData(this.currentKey, chapterData.data);
    }
    async getComicComments(comicId,index) {
        const forumResponse = await this.retryFetch(
            (i)=>`https://${this.servers[4-i]}/forum?page=${index}&mode=manhua&aid=${comicId}`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const forumData = await forumResponse.json();
        return crypto.decryptData(
            this.currentKey,
            forumData.data,
        ).list;
    }
    async getCategories(){
        const forumResponse = await this.retryFetch(
            (i)=>`https://${this.servers[4-i]}/categories`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const forumData = await forumResponse.json();
        return crypto.decryptData(
            this.currentKey,
            forumData.data,
        )
    }
    async getCategoriesFilter(category,page,order){
        const forumResponse = await this.retryFetch(
            (i)=>`https://${this.servers[4-i]}/categories/filter?page=${page}&c=${category}&o=${order}`,
            {
                headers: {
                    token: this.accessToken.token,
                    tokenParam: this.accessToken.tokenParam,
                },
                redirect: "follow",
            },
            5,
        );
        const forumData = await forumResponse.json();
        return crypto.decryptData(
            this.currentKey,
            forumData.data,
        )
    }
    getUserPhotoURL(path){
        return `https://${this.imgServers[setting.using_imgserver_index]}/media/users/${path}`
    }
    getCoverImageURL(id) {
        return `https://${this.imgServers[id % 5]}/media/albums/${id}_3x4.jpg`;
    }
    getChapterImageURL(id, pathName) {
        return `https://${this.imgServers[setting.using_imgserver_index]}/media/photos/${id}/${pathName}`;
    }
}
export const jmApi = new JmcomicApi();

