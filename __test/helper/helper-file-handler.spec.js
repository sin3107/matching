import { expect } from "chai";
import { movePictures, getBaseFileName, deleteFile } from "../../helper/file-handler.js"

describe("testing file handler", ()=>{
    describe("move pictures", ()=>{
        before(()=>{
            const oldPath = './uploads/users/test/Toonified-toonify-1634711334133-main.jpg';
            movePictures(oldPath, 'delete')
        })
        it("must move file to give id folder", ()=>{
            const oldPath = './uploads/users/delete/Toonified-toonify-1634711334133-main.jpg',
                id = 'test';
            const newPath = movePictures(oldPath, id);
            const checkPath = './uploads/users/test/Toonified-toonify-1634711334133-main.jpg';
            expect(newPath).to.be.equal(checkPath)
        })
        // dirty cases?
    })
    describe("save iamge ", ()=>{}) // NOTE should test but... how?
    describe("get base file name", ()=>{
        it("should return the base file name", ()=>{
            const fileName = './uploads/users/delete/Toonified-toonify-1634711334133-main.jpg',
            baseName = getBaseFileName(fileName);
            expect(baseName).to.be.equal("Toonified-toonify-1634711334133-main.jpg")
        })
        // dirty cases to throw error
    })
    describe("delete file", ()=>{
        it("must delete given file", ()=>{
            // how to check?
            // const filename = "./uploads/users/delete/Toonified-toonify-1kajsdlfkd.jpg" // NOTE doesn't exist
            // delteFile(filename);
        })
    })
})