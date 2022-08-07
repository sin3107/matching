export default function makeCsDb(makeDb){

    return Object.freeze({
        getFaqList,
        insertQna
    })

    // ANCHOR db
    /**
     * 
     * @returns {Promise<object>} faq collection db
     */
    async function getFaqDb(){
        try {
            const db = await makeDb();
            return db.collection('faq');
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    async function getQnaDb(){
        try {
            const db = await makeDb();
            return db.collection('qna')
        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function getFaqList(createdAt = new Date(), type){
        try {
            const db = await getFaqDb()

            // if(type){
            //     return db.aggregate(
            //         [
            //             { $match: { type:0 } },
            //             {
            //                 $lookup : {
            //                     from: "faq",
            //                     let: {ida: '$_id'},
            //                     pipeline: [
            //                         {
            //                             $sort: {
            //                                 createdAt: -1
            //                             }
            //                         },
            //                         {
            //                             $match: {
            //                                 $expr: {
            //                                     $eq: ['$category', '$$ida']
            //                                 }
            //                             }
            //                         }
            //                     ],
            //                     as: "items"
            //                 }
            //             }

            //         ]
            //     ).toArray()
            // } else {
                return db.find({createdAt: {$lt: createdAt}, type: 1}).sort({'createdAt': -1}).limit(10).toArray()
            //}
            
        } catch (err) {
            console.log(err);
            throw err;
        }
    }

    async function insertQna(qna){
        try {
            const db = await getQnaDb()
            return db.insertOne(qna);
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
    
}