import argparse
import json
import spacy
from http.server import HTTPServer, BaseHTTPRequestHandler

model_languages = {
    "zh": "zh_core_web_trf",
    "ca": "ca_core_news_trf",
    "da": "da_core_news_trf",
    "nl": "nl_core_news_lg",
    "en": "en_core_web_trf",
    "fr": "fr_dep_news_trf",
    "de": "de_dep_news_trf",
    "el": "el_core_news_lg",
    "it": "it_core_news_lg",
    "ja": "ja_core_news_trf",
    "lt": "lt_core_news_lg",
    "mk": "mk_core_news_lg",
    "xx": "xx_sent_ud_sm",
    "nb": "nb_core_news_lg",
    "pl": "pl_core_news_lg",
    "pt": "pt_core_news_lg",
    "ro": "ro_core_news_lg",
    "ru": "ru_core_news_lg",
    "es": "es_dep_news_trf",
}
Models = {}

class S(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length']) # <--- Gets the size of data
        post_data = self.rfile.read(content_length) # <--- Gets the data itself
        
        body = json.loads(post_data.decode('utf-8'))
        lang, text = body['lang'], body['text']
        model = model_languages[lang]
        nlp = None
        if(model in Models.keys()):
            nlp = Models[model]
        else:
            print("Loading model:", model)
            nlp = spacy.load(model)
            print("Model loaded")
            Models[model] = nlp
        
        doc = nlp(text)
        response = json.dumps(doc.to_json()).encode('utf-8')
        # Doesn't do anything with posted data
        self._set_headers()
        self.wfile.write(response)


def run(server_class=HTTPServer, handler_class=S, addr="localhost", port=8000):
    server_address = (addr, port)
    httpd = server_class(server_address, handler_class)

    print(f"Starting httpd server on {addr}:{port}")
    httpd.serve_forever()


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description="Run a simple HTTP server")
    parser.add_argument(
        "-l",
        "--listen",
        default="localhost",
        help="Specify the IP address on which the server listens",
    )
    parser.add_argument(
        "-p",
        "--port",
        type=int,
        default=8000,
        help="Specify the port on which the server listens",
    )
    args = parser.parse_args()
    run(addr=args.listen, port=args.port)