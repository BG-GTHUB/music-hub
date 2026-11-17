import SwiftUI
import WebKit
import AVFoundation

// Chord Classroom Player for iPad / iPhone.
// The whole player lives in chord-converter.html; this file just shows it full-screen.

struct ContentView: View {
    var body: some View {
        PlayerWebView()
            .ignoresSafeArea(.container, edges: .bottom)
            .background(Color.black.ignoresSafeArea())
            .preferredColorScheme(.dark)
            .onAppear {
                // Keep the screen awake while teaching
                UIApplication.shared.isIdleTimerDisabled = true

                // Play audio even when the silent switch is on
                try? AVAudioSession.sharedInstance().setCategory(.playback)
            }
    }
}

struct PlayerWebView: UIViewRepresentable {

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.uiDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.backgroundColor = .black

        if let url = Bundle.main.url(forResource: "chord-converter", withExtension: "html"),
           let html = try? String(contentsOf: url, encoding: .utf8) {
            // The fixed address gives the page a stable home for its saved songs and audio.
            // Nothing is loaded from the internet.
            webView.loadHTMLString(html, baseURL: URL(string: "https://chord-classroom.invalid/"))
        } else {
            webView.loadHTMLString(
                "<h2 style='color:white;font-family:sans-serif'>chord-converter.html is missing from the app. Add it to the project and tick the app target.</h2>",
                baseURL: nil
            )
        }

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    // Shows the page's "Delete this song?" style questions as a normal iOS alert.
    // Without this, a web view silently answers "Cancel" every time.
    @MainActor
    final class Coordinator: NSObject, WKUIDelegate {

        func webView(
            _ webView: WKWebView,
            runJavaScriptConfirmPanelWithMessage message: String,
            initiatedByFrame frame: WKFrameInfo
        ) async -> Bool {
            guard let presenter = webView.window?.rootViewController else { return false }

            return await withCheckedContinuation { continuation in
                let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)

                alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in
                    continuation.resume(returning: false)
                })
                alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
                    continuation.resume(returning: true)
                })

                presenter.present(alert, animated: true)
            }
        }
    }
}
