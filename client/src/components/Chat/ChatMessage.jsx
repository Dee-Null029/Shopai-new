import ReactMarkdown from 'react-markdown';
import { FiStar, FiExternalLink } from 'react-icons/fi';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'bg-brand-600 text-white rounded-2xl rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm'} px-4 py-2.5`}>
        <div className="text-sm leading-relaxed prose prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Product recommendations */}
        {message.products?.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.products.map((product, i) => (
              <div key={i} className="bg-white rounded-lg p-3 flex gap-3 shadow-sm">
                {product.image && (
                  <img src={product.image} alt="" className="w-14 h-14 object-contain rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 line-clamp-2">{product.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-gray-900">₹{product.price?.toLocaleString('en-IN')}</span>
                    {product.rating && (
                      <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                        <FiStar className="w-3 h-3 fill-current" /> {product.rating}
                      </span>
                    )}
                  </div>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline mt-1"
                  >
                    View on {product.platform} <FiExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
