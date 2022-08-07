function out (d) {

    // array type은 pagination이 필요없는 list data
    // object type은 single data. or data processed for pageing
    
    let o = {success: true}

    if(d){
        // array type
        if (d instanceof Array) {
            o.data = {
                item: d,
                item_length: d.length,
                total: d.length
            }

        // object type
        } else {
            if(d.item) {
                o.data = d
            }else {
                o.data = {item : d}
            }

            // 단일 객체일 경우
            if (!o.data.hasOwnProperty('total')) {
                o.data['item_length'] = 1
                o.data['total'] = 1

            // 페이징 데이터 일 경우
            } else {
                o.data['item_length'] = o.data.item.length
            }
        }
    }
    
    return o
}

export default out;