export default function buildQna(generateId){
    return ({
        _id, 
        userId,
        category,
        email,
        subject,
        question
    }) => {
        if(!_id) _id = generateId()
        return Object.freeze({
            _id: String(_id),
            type: 1,
            userId: String(userId),
            category: String(category),
            email: String(email),
            subject: String(subject),
            question: String(question),
            answer: '',
            answerCreatedAt: '',
            createdAt: new Date()
        })
    }
}