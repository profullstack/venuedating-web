import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {
    private var webView: WKWebView!
    private var progressView: UIProgressView!
    private var bottomNavigationBar: BottomNavigationBar!
    private var observation: NSKeyValueObservation?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        setupWebView()
        setupProgressView()
        setupNavigationBar()
        setupBottomNavigationBar()
        loadWebsite()
    }
    
    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        
        // Add preferences for PWA support
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        configuration.defaultWebpagePreferences = preferences
        
        // Create webView with adjusted frame to account for bottom navigation bar
        let bottomBarHeight: CGFloat = 56
        var webViewFrame = view.bounds
        webViewFrame.size.height -= bottomBarHeight
        
        webView = WKWebView(frame: webViewFrame, configuration: configuration)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        view.addSubview(webView)
        
        // Observe loading progress
        observation = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] _, change in
            guard let self = self, let newValue = change.newValue else { return }
            self.progressView.progress = Float(newValue)
            self.progressView.isHidden = newValue == 1
        }
    }
    
    private func setupProgressView() {
        progressView = UIProgressView(progressViewStyle: .default)
        progressView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(progressView)
        
        NSLayoutConstraint.activate([
            progressView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            progressView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])
    }
    
    private func setupNavigationBar() {
        title = "PDF Converter"
        
        // Add refresh button
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .refresh,
            target: self,
            action: #selector(refreshTapped)
        )
    }
    
    private func setupBottomNavigationBar() {
        let bottomBarHeight: CGFloat = 56
        let bottomBarFrame = CGRect(
            x: 0,
            y: view.bounds.height - bottomBarHeight,
            width: view.bounds.width,
            height: bottomBarHeight
        )
        
        bottomNavigationBar = BottomNavigationBar(frame: bottomBarFrame)
        bottomNavigationBar.autoresizingMask = [.flexibleWidth, .flexibleTopMargin]
        view.addSubview(bottomNavigationBar)
        
        // Set up home button action
        bottomNavigationBar.onHomeTapped = { [weak self] in
            self?.loadWebsite()
        }
    }
    
    private func loadWebsite() {
        // Load URL from Config which reads from .env file
        if let url = URL(string: Config.apiBaseURL) {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }
    
    @objc private func refreshTapped() {
        webView.reload()
    }
    
    // MARK: - WKNavigationDelegate
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        title = webView.title
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        // Handle navigation errors
        print("Navigation error: \(error.localizedDescription)")
    }
    
    deinit {
        observation?.invalidate()
    }
}