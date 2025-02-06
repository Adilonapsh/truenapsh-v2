

const downloadAsJsonFile = (input, file_name = 'export.json') => {
    const dataStr = JSON.stringify(input, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

const downloadAsTextFile = (input, file_name = 'export.txt') => {
    const dataStr = typeof input === 'object' ? JSON.stringify(input) : String(input || '');
    const blob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}



export {
    downloadAsJsonFile,
    downloadAsTextFile
}