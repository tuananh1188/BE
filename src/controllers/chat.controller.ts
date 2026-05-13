import { Request, Response } from 'express';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { ProductModel } from '../models/product.model';

// Initialize Gemini API
const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
};

// Khai báo công cụ tìm kiếm sản phẩm cho AI
const searchProductsDeclaration: FunctionDeclaration = {
    name: "searchProducts",
    description: "Tra cứu các sản phẩm đang có trong database của cửa hàng SPCK-X41 dựa trên từ khóa tìm kiếm (như áo thun, quần jean, màu sắc, điện thoại, iphone, v.v.). Hàm này sẽ trả về danh sách tối đa 5 sản phẩm khớp với từ khóa, bao gồm tên, giá, số lượng tồn kho (stock), màu sắc và size.",
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            keyword: {
                type: SchemaType.STRING,
                description: "Từ khóa tìm kiếm sản phẩm. Ví dụ: 'áo thun', 'màu đỏ', 'iphone', 'váy'"
            }
        },
        required: ["keyword"]
    }
};

export const handleChat = async (req: Request, res: Response): Promise<any> => {
    try {
        const { message, history } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const genAI = getGenAI();
        if (!genAI) {
            return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured in backend' });
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: "Bạn là trợ lý ảo SPCK-X41. Khi người dùng hỏi về bất kỳ sản phẩm nào, hãy ưu tiên dùng công cụ searchProducts để tra cứu xem cửa hàng có bán không trước khi trả lời. Nếu searchProducts trả về rỗng, hãy báo là cửa hàng không bán sản phẩm đó. Báo giá tiền kèm chữ 'đ' (ví dụ 150000đ). Trả lời thân thiện, lịch sự. ĐẶC BIỆT LƯU Ý: Khi liệt kê nhiều sản phẩm, BẮT BUỘC phải xuống dòng cho mỗi sản phẩm để dễ đọc.",
            tools: [{ functionDeclarations: [searchProductsDeclaration] }]
        });

        const chat = model.startChat({
            history: history || []
        });

        // Gửi tin nhắn từ người dùng
        let result = await chat.sendMessage(message);

        // Kiểm tra xem AI có muốn gọi hàm (Function Call) không
        const functionCalls = result.response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            if (call.name === "searchProducts") {
                const keyword = (call.args as any).keyword as string;
                console.log(`[Chatbot] AI is searching DB for: ${keyword}`);
                
                // Thực thi query MongoDB
                const products = await ProductModel.find({ 
                    name: { $regex: keyword, $options: 'i' } 
                })
                .select('name price stock colors sizes')
                .limit(5)
                .lean();

                // Gửi kết quả DB lại cho AI để nó tiếp tục sinh ra câu trả lời
                result = await chat.sendMessage([{
                    functionResponse: {
                        name: "searchProducts",
                        response: { products: products }
                    }
                }]);
            }
        }

        const responseText = result.response.text();
        return res.json({ success: true, text: responseText });
    } catch (error: any) {
        console.error("Chatbot Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
