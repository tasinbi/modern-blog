import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { blogAPI, categoryAPI } from '../../services/api';
import { FiSave, FiArrowLeft, FiImage, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const BlogForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    slug: '',
    author: '',
    category_id: '',
    meta_keywords: '',
    meta_description: '',
    image: null
  });

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchBlog();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error loading categories');
    }
  };

  const fetchBlog = async () => {
    try {
      setIsLoading(true);
      const response = await blogAPI.getById(id);
      const blog = response.data.data;
      
      setFormData({
        title: blog.title || '',
        content: blog.content || '',
        slug: blog.slug || '',
        author: blog.author || '',
        category_id: blog.category_id || '',
        meta_keywords: blog.meta_keywords || '',
        meta_description: blog.meta_description || '',
        image: null
      });

      if (blog.image) {
        setExistingImage(blog.image);
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      toast.error('Error loading blog');
      navigate('/admin/blogs');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (title) => {
    if (!title) return '';
    
    return title
      .toLowerCase()
      .trim()
      // Replace spaces with hyphens
      .replace(/\s+/g, '-')
      // Remove special characters but keep Bangla characters, English letters, numbers, and hyphens
      .replace(/[^\u0980-\u09FF\u0900-\u097Fa-z0-9\-]/g, '')
      // Replace multiple consecutive hyphens with single hyphen
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '');
  };

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from title only if user hasn't manually edited it
    if (name === 'title' && !isSlugManuallyEdited) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }

    // Track if user manually edits the slug
    if (name === 'slug') {
      setIsSlugManuallyEdited(true);
    }
  };

  const handleSlugReset = () => {
    const newSlug = generateSlug(formData.title);
    setFormData(prev => ({ ...prev, slug: newSlug }));
    setIsSlugManuallyEdited(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    setExistingImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      
      // Add all form fields, ensuring proper values
      submitData.append('title', formData.title || '');
      submitData.append('content', formData.content || '');
      submitData.append('slug', formData.slug || '');
      submitData.append('author', formData.author || '');
      
      // Only add category_id if it's not empty
      if (formData.category_id && formData.category_id !== '') {
        submitData.append('category_id', formData.category_id);
      }
      
      // Optional fields
      if (formData.meta_keywords) {
        submitData.append('meta_keywords', formData.meta_keywords);
      }
      if (formData.meta_description) {
        submitData.append('meta_description', formData.meta_description);
      }
      
      // Add image if present
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      // Debug: Log what we're sending
      console.log('Sending form data:');
      for (let [key, value] of submitData.entries()) {
        console.log(key, value);
      }

      let response;
      if (isEditing) {
        response = await blogAPI.update(id, submitData);
      } else {
        response = await blogAPI.create(submitData);
      }

      if (response.data.success) {
        toast.success(isEditing ? 'Blog updated successfully!' : 'Blog created successfully!');
        navigate('/admin/blogs');
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      
      // More detailed error handling
      if (error.response?.data?.errors) {
        // Show validation errors
        error.response.data.errors.forEach(err => {
          toast.error(`${err.param}: ${err.msg}`);
        });
      } else {
        const message = error.response?.data?.message || 'Error saving blog';
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isEditing ? 'Edit Blog' : 'Create Blog'} - Banglay IELTS Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/blogs')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Blog' : 'Create New Blog'}
              </h1>
              <p className="text-gray-600">
                {isEditing ? 'Update your blog post' : 'Write and publish a new blog post'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Title */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Blog Details</h3>
                </div>
                <div className="card-body space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter blog title"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                      URL Slug *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        id="slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        className="form-input flex-1"
                        placeholder="blog-url-slug"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleSlugReset}
                        className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        title="Reset slug from title"
                      >
                        🔄
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      URL: /blog/{formData.slug || 'your-slug'}
                      {isSlugManuallyEdited && (
                        <span className="text-blue-600 ml-2">• Manually edited</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                      Author *
                    </label>
                    <input
                      type="text"
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Author name"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Content</h3>
                </div>
                <div className="card-body">
                  <CKEditor
                    editor={ClassicEditor}
                    data={formData.content}
                    config={{
                      toolbar: [
                        'heading',
                        '|',
                        'bold',
                        'italic',
                        'underline',
                        '|',
                        'link',
                        'bulletedList',
                        'numberedList',
                        '|',
                        'outdent',
                        'indent',
                        '|',
                        'imageUpload',
                        'blockQuote',
                        'insertTable',
                        'mediaEmbed',
                        '|',
                        'undo',
                        'redo',
                        'sourceEditing'
                      ],
                      heading: {
                        options: [
                          { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                          { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                          { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                          { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' }
                        ]
                      },
                      placeholder: 'Write your blog content here...',
                      image: {
                        toolbar: ['imageTextAlternative', 'imageStyle:full', 'imageStyle:side']
                      }
                    }}
                    onChange={(event, editor) => {
                      const data = editor.getData();
                      setFormData(prev => ({ ...prev, content: data }));
                    }}
                    onReady={editor => {
                      // You can store the "editor" and use when it is needed.
                      console.log('CKEditor is ready to use!', editor);
                    }}
                    onBlur={(event, editor) => {
                      console.log('Blur.', editor);
                    }}
                    onFocus={(event, editor) => {
                      console.log('Focus.', editor);
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Use the rich text editor to format your content
                  </p>
                </div>
              </div>

              {/* SEO */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">SEO Settings</h3>
                </div>
                <div className="card-body space-y-4">
                  <div>
                    <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      id="meta_description"
                      name="meta_description"
                      value={formData.meta_description}
                      onChange={handleInputChange}
                      rows={3}
                      className="form-textarea"
                      placeholder="Brief description for search engines"
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.meta_description.length}/160 characters
                    </p>
                  </div>

                  <div>
                    <label htmlFor="meta_keywords" className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      id="meta_keywords"
                      name="meta_keywords"
                      value={formData.meta_keywords}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Actions */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
                </div>
                <div className="card-body space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <LoadingSpinner size="small" color="white" />
                        <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <FiSave size={16} />
                        <span>{isEditing ? 'Update Blog' : 'Create Blog'}</span>
                      </div>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate('/admin/blogs')}
                    className="w-full btn btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Category</h3>
                </div>
                <div className="card-body">
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Featured Image */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Featured Image</h3>
                </div>
                <div className="card-body">
                  {(imagePreview || existingImage) ? (
                    <div className="relative">
                      <img
                        src={imagePreview || `http://localhost:5000/${existingImage}`}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="block">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200 cursor-pointer">
                        <FiImage className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload image
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default BlogForm;