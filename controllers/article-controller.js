import { article_use_case } from "../use-cases/handle-article.js";

const httpResponse = {
    headers: '',
    statusCode: '',
    body: ''
}

// ANCHOR status code list
const ok = '200';
const created = '201';
const badRequest = '400';
const unauthorized = '401';
const serverError = '500';

export {
    postArticle ,
    getArticles,
    getPopularArticles,
    getMyArticles,
    getArticle,
    putArticle,
    deleteArticle,
    postComment,
    putComment,
    deleteComment,
    postArticleLike,
    getCommentList,
    getComment
}
/**
 * add article and return id
 * @param {object} httpRequest 
 * @returns {Promise<{statusCode: string, body: {id: string}}>}
 * @error log & return
 */
async function postArticle(httpRequest){
    try {
        const {body} = httpRequest;
        const result = await article_use_case.addArticle(body);
        if(result.status){
            httpResponse.statusCode = created;
            httpResponse.body = result.body;
            return httpResponse;
        } else {
            httpResponse.statusCode = badRequest;
            httpResponse.body = result.body;
            return httpResponse;
        }
    } catch (err) {
        console.log(err);
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse
    }
}
/**
 * get all articles
 * @param {object} httpRequest 
 * @returns {Promise<{statusCode: string, body: {articles: Array}}>}
 * @error log & return
 */
async function getArticles(httpRequest){
    try {
        const {query: {createdAt, articleType}, body} = httpRequest
        const result = await article_use_case.getAllArticles({createdAt, articleType, body});
        if(result.status){
            httpResponse.statusCode = ok;
            httpResponse.body = result.body;
            return httpResponse;
        } else {
            httpResponse.statusCode = badRequest;
            httpResponse.body = result.body;
            return httpResponse;
        }
    } catch (err) {
        console.log(err);
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse
    }   
}
/**
 * 인기순 게시글 받기
 * @param {object} httpRequest 
 * @returns {Promise<statusCode: string, body: object, headers: object>}
 */
async function getPopularArticles(httpRequest){
    try {
        const {body: {user: {_id}}, query: {articleType, pagination}} = httpRequest;
        const {status, body} = await article_use_case.getPopularArticles(_id, articleType, pagination)
        httpResponse.statusCode = status ? ok : badRequest;
        httpResponse.body = body
        return httpResponse
    } catch (err) {
        console.log(err);
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse
    }
}
async function getMyArticles(httpRequest){
    try {
        const {query: {createdAt, articleType}, body: {user: {_id: userId}}} = httpRequest
        const result = await article_use_case.getMyArticles({userId, createdAt, articleType})
        if(result.status){
            httpResponse.statusCode = ok;
            httpResponse.body = result.body;
            return httpResponse;
        } else {
            httpResponse.statusCode = badRequest;
            httpResponse.body = result.body;
            return httpResponse;
        }
    } catch (err) {
        console.log(err);
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse
    }  
}
/**
 * get one article by article id
 * @param {object} httpRequest {params:{id}}
 * @returns {Promise<{statusCode: string, body: {article: object}}>}
 * @error log & return
 */
async function getArticle(httpRequest){
    try {
        const {params:{id}, body, query: {articleType}} = httpRequest;
        const result = await article_use_case.getOneArticle({articleId: id, body, articleType});
        if(result.status){
            httpResponse.statusCode = ok;
            httpResponse.body = result.body;
            return httpResponse;
        } else {
            httpResponse.statusCode = badRequest;
            httpResponse.body = result.body;
            return httpResponse;
        }
    } catch (err) {
        console.log(err);
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse
    }
}
/**
 * update one article 
 * @param {object} httpRequest params:id, body: article
 * @returns {Promise<{statusCode: string, body: {article: object}}>}
 * @error log & return
 */
async function putArticle(httpRequest){
    try {
        const {params:{id}, body: {article, user: {_id}}, query: {articleType}} = httpRequest;
        const result = await article_use_case.updateArticle(id, article, articleType, _id);
        if(result.status){
            httpResponse.statusCode = ok;
            httpResponse.body = result.body;
            return httpResponse;
        } else {
            httpResponse.statusCode = badRequest;
            httpResponse.body = result.body;
            return httpResponse;
        }
    } catch (err) {
        console.log(err);
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse
    }
}
/**
 * delete one article
 * @param {object} httpRequest params:id
 * @returns {Promise<{statusCode: string, body: {deletedCount: number}}>}
 * @error log & return
 */
async function deleteArticle(httpRequest){
    try {
        const {params:{id}, query: {articleType}, body: {user: {_id}}} = httpRequest;
        const result = await article_use_case.deleteArticle(id, _id, articleType);
        if(result.status){
            httpResponse.statusCode = ok;
            httpResponse.body = result.body;
            return httpResponse;
        } else {
            httpResponse.statusCode = badRequest;
            httpResponse.body = result.body;
            return httpResponse;
        }
    } catch (err) {
        console.log(err);
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse
    }
}
async function postArticleLike(httpRequest){
    try {
        const {body: {articleId, user: {_id}}, query: {articleType}} = httpRequest;
        const result = await article_use_case.addLikeToArticle(articleId, _id, articleType);
        if(result.status){
            httpResponse.statusCode = ok;
            httpResponse.body = result.body;
            return httpResponse;
        } else {
            httpResponse.statusCode = badRequest;
            httpResponse.body = result.body;
            return httpResponse;
        }
    } catch (err) {
        console.log(err);
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse;
    }
}

async function postComment(httpRequest){
    try {
        const {body, query: {articleType}} = httpRequest
        const result = await article_use_case.addComment(body, articleType);
        if(result.status){
            httpResponse.statusCode = created;
            httpResponse.body = result.body;
            return httpResponse;
        } else {
            httpResponse.statusCode = badRequest;
            httpResponse.body = result.body;
            return httpResponse;
        }
    } catch (err) {
        console.log(err);
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse
    }
}
async function putComment(httpRequest) {
    try {
        const {params: {commentId}, query: {articleType}, body} = httpRequest
        const result = await article_use_case.editComment(commentId, body, articleType);
        if(result.status) {
            httpResponse.statusCode = ok
            httpResponse.body = result.body
            return httpResponse
        } else {
            httpResponse.statusCode = badRequest
            httpResponse.body = result.body
            return httpResponse
        }
    } catch (err) {
        console.log(err)
        httpResponse.statusCode = serverError
        httpResponse.body = err.message
        return httpResponse
    }
}
async function deleteComment(httpRequest) {
    try {
        const {params: {commentId}, body, query: {articleType}} = httpRequest
        const result = await article_use_case.deleteComment(commentId, body, articleType)
        if(result.status) {
            httpResponse.statusCode = ok
            httpResponse.body = result.body
            return httpResponse
        } else {
            httpResponse.statusCode = badRequest
            httpResponse.body = result.body
            return httpResponse
        }
    } catch (err) {
        console.log(err)
        httpResponse.statusCode = serverError
        httpResponse.body = err.message
        return httpResponse
    }
}

async function getCommentList(httpRequest) {
    try {
        const {query: {createdAt, articleType}, params: {articleId}} = httpRequest
        const result = await article_use_case.getCommentList(articleId, createdAt, httpRequest.query, articleType)
        if(result.status) {
            httpResponse.statusCode = ok
            httpResponse.body = result.body
            return httpResponse
        } else {
            httpResponse.statusCode = badRequest
            httpResponse.body = result.body
            return httpResponse
        }
    } catch (err) {
        console.log(err)
        httpResponse.statusCode = serverError
        httpResponse.body = err.message
        return httpResponse
    }
}

async function getComment(httpRequest) {
    try {
        const {params: {commentId}, query: {articleType}} = httpRequest
        const result = await article_use_case.getComment(commentId, articleType)
        if(result.status) {
            httpResponse.statusCode = ok
            httpResponse.body = result.body
            return httpResponse
        } else {
            httpResponse.statusCode = badRequest
            httpResponse.body = result.body
            return httpResponse
        }
    } catch (err) {
        console.log(err)
        httpResponse.statusCode = serverError
        httpResponse.body = err.message
        return httpResponse
    }
}