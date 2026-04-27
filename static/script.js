document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const fileNameDisplay = document.getElementById('file-name');
    const controls = document.getElementById('controls');
    const generateBtn = document.getElementById('generate-btn');
    const loadingState = document.getElementById('loading-state');
    const resultArea = document.getElementById('result-area');
    const summaryContent = document.getElementById('summary-content');
    const errorMessage = document.getElementById('error-message');
    const resetBtn = document.getElementById('reset-btn');

    let selectedFile = null;

    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        }, false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Handle browse button click
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the uploadArea click
        fileInput.click();
    });
    
    // Also trigger on area click
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type !== 'application/pdf') {
                showError('Please upload a valid PDF file.');
                return;
            }
            
            selectedFile = file;
            fileNameDisplay.textContent = file.name;
            controls.classList.remove('hidden');
            hideError();
        }
    }

    // Handle summary generation
    generateBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        // Update UI state
        uploadArea.classList.add('hidden');
        controls.classList.add('hidden');
        resultArea.classList.add('hidden');
        loadingState.classList.remove('hidden');
        hideError();

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/api/summarize', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'An error occurred during summarization.');
            }

            // Display results
            // Convert markdown response to HTML using the marked library
            summaryContent.innerHTML = marked.parse(data.summary);
            
            loadingState.classList.add('hidden');
            resultArea.classList.remove('hidden');
            
        } catch (error) {
            loadingState.classList.add('hidden');
            uploadArea.classList.remove('hidden');
            controls.classList.remove('hidden');
            showError(error.message);
        }
    });

    // Handle reset
    resetBtn.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        fileNameDisplay.textContent = '';
        
        resultArea.classList.add('hidden');
        controls.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        hideError();
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
    }
});
