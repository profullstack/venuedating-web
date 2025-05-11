import UIKit

class BottomNavigationBar: UIView {
    // Home button
    private let homeButton = UIButton(type: .system)
    
    // Callback for when home button is tapped
    var onHomeTapped: (() -> Void)?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }
    
    private func setupView() {
        // Set background color to primary color
        backgroundColor = AppColors.primary
        
        // Configure home button
        homeButton.setTitle("Home", for: .normal)
        homeButton.setTitleColor(AppColors.textOnPrimary, for: .normal)
        homeButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        homeButton.addTarget(self, action: #selector(homeButtonTapped), for: .touchUpInside)
        
        // Add home button to view
        homeButton.translatesAutoresizingMaskIntoConstraints = false
        addSubview(homeButton)
        
        // Center the home button
        NSLayoutConstraint.activate([
            homeButton.centerXAnchor.constraint(equalTo: centerXAnchor),
            homeButton.centerYAnchor.constraint(equalTo: centerYAnchor),
            homeButton.heightAnchor.constraint(equalToConstant: 44)
        ])
    }
    
    @objc private func homeButtonTapped() {
        onHomeTapped?()
    }
}